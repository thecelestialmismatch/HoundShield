use std::io::{self, IsTerminal, Write};

use crossterm::cursor::{MoveDown, MoveToColumn, MoveUp};
use crossterm::event::{self, Event, KeyCode, KeyEvent, KeyModifiers};
use crossterm::queue;
use crossterm::terminal::{disable_raw_mode, enable_raw_mode, Clear, ClearType};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InputBuffer {
    buffer: String,
    cursor: usize,
}

impl InputBuffer {
    #[must_use]
    pub fn new() -> Self {
        Self {
            buffer: String::new(),
            cursor: 0,
        }
    }

    pub fn insert(&mut self, ch: char) {
        self.buffer.insert(self.cursor, ch);
        self.cursor += ch.len_utf8();
    }

    pub fn insert_newline(&mut self) {
        self.insert('\n');
    }

    pub fn backspace(&mut self) {
        if self.cursor == 0 {
            return;
        }

        let previous = self.buffer[..self.cursor]
            .char_indices()
            .last()
            .map_or(0, |(idx, _)| idx);
        self.buffer.drain(previous..self.cursor);
        self.cursor = previous;
    }

    pub fn move_left(&mut self) {
        if self.cursor == 0 {
            return;
        }
        self.cursor = self.buffer[..self.cursor]
            .char_indices()
            .last()
            .map_or(0, |(idx, _)| idx);
    }

    pub fn move_right(&mut self) {
        if self.cursor >= self.buffer.len() {
            return;
        }
        if let Some(next) = self.buffer[self.cursor..].chars().next() {
            self.cursor += next.len_utf8();
        }
    }

    pub fn move_home(&mut self) {
        self.cursor = 0;
    }

    pub fn move_end(&mut self) {
        self.cursor = self.buffer.len();
    }

    #[must_use]
    pub fn as_str(&self) -> &str {
        &self.buffer
    }

    #[cfg(test)]
    #[must_use]
    pub fn cursor(&self) -> usize {
        self.cursor
    }

    pub fn clear(&mut self) {
        self.buffer.clear();
        self.cursor = 0;
    }

    pub fn replace(&mut self, value: impl Into<String>) {
        self.buffer = value.into();
        self.cursor = self.buffer.len();
    }

    #[must_use]
    fn current_command_prefix(&self) -> Option<&str> {
        if self.cursor != self.buffer.len() {
            return None;
        }
        let prefix = &self.buffer[..self.cursor];
        if prefix.contains(char::is_whitespace) || !prefix.starts_with('/') {
            return None;
        }
        Some(prefix)
    }

    pub fn complete_slash_command(&mut self, candidates: &[String]) -> bool {
        let Some(prefix) = self.current_command_prefix() else {
            return false;
        };

        let matches = candidates
            .iter()
            .filter(|candidate| candidate.starts_with(prefix))
            .map(String::as_str)
            .collect::<Vec<_>>();
        if matches.is_empty() {
            return false;
        }

        let replacement = longest_common_prefix(&matches);
        if replacement == prefix {
            return false;
        }

        self.replace(replacement);
        true
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RenderedBuffer {
    lines: Vec<String>,
    cursor_row: u16,
    cursor_col: u16,
}

impl RenderedBuffer {
    #[must_use]
    pub fn line_count(&self) -> usize {
        self.lines.len()
    }

    fn write(&self, out: &mut impl Write) -> io::Result<()> {
        for (index, line) in self.lines.iter().enumerate() {
            if index > 0 {
                writeln!(out)?;
            }
            write!(out, "{line}")?;
        }
        Ok(())
    }

    #[cfg(test)]
    #[must_use]
    pub fn lines(&self) -> &[String] {
        &self.lines
    }

    #[cfg(test)]
    #[must_use]
    pub fn cursor_position(&self) -> (u16, u16) {
        (self.cursor_row, self.cursor_col)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ReadOutcome {
    Submit(String),
    Cancel,
    Exit,
}

pub struct LineEditor {
    prompt: String,
    continuation_prompt: String,
    history: Vec<String>,
    history_index: Option<usize>,
    draft: Option<String>,
    completions: Vec<String>,
}

impl LineEditor {
    #[must_use]
    pub fn new(prompt: impl Into<String>, completions: Vec<String>) -> Self {
        Self {
            prompt: prompt.into(),
            continuation_prompt: String::from("> "),
            history: Vec::new(),
            history_index: None,
            draft: None,
            completions,
        }
    }

    pub fn push_history(&mut self, entry: impl Into<String>) {
        let entry = entry.into();
        if entry.trim().is_empty() {
            return;
        }
        self.history.push(entry);
        self.history_index = None;
        self.draft = None;
    }

    pub fn read_line(&mut self) -> io::Result<ReadOutcome> {
        if !io::stdin().is_terminal() || !io::stdout().is_terminal() {
            return self.read_line_fallback();
        }

        enable_raw_mode()?;
        let mut stdout = io::stdout();
        let mut input = InputBuffer::new();
        let mut rendered_lines = 1usize;
        self.redraw(&mut stdout, &input, rendered_lines)?;

        loop {
            let event = event::read()?;
            if let Event::Key(key) = event {
                match self.handle_key(key, &mut input) {
                    EditorAction::Continue => {
                        rendered_lines = self.redraw(&mut stdout, &input, rendered_lines)?;
                    }
                    EditorAction::Submit => {
                        disable_raw_mode()?;
                        writeln!(stdout)?;
                        self.history_index = None;
                        self.draft = None;
                        return Ok(ReadOutcome::Submit(input.as_str().to_owned()));
                    }
                    EditorAction::Cancel => {
                        disable_raw_mode()?;
                        writeln!(stdout)?;
                        self.history_index = None;
                        self.draft = None;
                        return Ok(ReadOutcome::Cancel);
                    }
                    EditorAction::Exit => {
                        disable_raw_mode()?;
                        writeln!(stdout)?;
                        self.history_index = None;
                        self.draft = None;
                        return Ok(ReadOutcome::Exit);
                    }
                }
            }
        }
    }

    fn read_line_fallback(&self) -> io::Result<ReadOutcome> {
        let mut stdout = io::stdout();
        write!(stdout, "{}", self.prompt)?;
        stdout.flush()?;

        let mut buffer = String::new();
        let bytes_read = io::stdin().read_line(&mut buffer)?;
        if bytes_read == 0 {
            return Ok(ReadOutcome::Exit);
        }

        while matches!(buffer.chars().last(), Some('\n' | '\r')) {
            buffer.pop();
        }
        Ok(ReadOutcome::Submit(buffer))
    }

    #[allow(clippy::too_many_lines)]
    fn handle_key(&mut self, key: KeyEvent, input: &mut InputBuffer) -> EditorAction {
        match key {
            KeyEvent {
                code: KeyCode::Char('c'),
                modifiers,
                ..
            } if modifiers.contains(KeyModifiers::CONTROL) => {
                if input.as_str().is_empty() {
                    EditorAction::Exit
                } else {
                    input.clear();
                    self.history_index = None;
                    self.draft = None;
                    EditorAction::Cancel
                }
            }
            KeyEvent {
                code: KeyCode::Char('j'),
                modifiers,
                ..
            } if modifiers.contains(KeyModifiers::CONTROL) => {
                input.insert_newline();
                EditorAction::Continue
            }
            KeyEvent {
                code: KeyCode::Enter,
                modifiers,
                ..
            } if modifiers.contains(KeyModifiers::SHIFT) => {
                input.insert_newline();
                EditorAction::Continue
            }
            KeyEvent {
                code: KeyCode::Enter,
                ..
            } => EditorAction::Submit,
            KeyEvent {
                code: KeyCode::Backspace,
                ..
            } => {
                input.backspace();
                EditorAction::Continue
            }
            KeyEvent {
                code: KeyCode::Left,
                ..
            } => {
                input.move_left();
                EditorAction::Continue
            }
            KeyEvent {
                code: KeyCode::Right,
                ..
            } => {
                input.move_right();
                EditorAction::Continue
            }
            KeyEvent {
                code: KeyCode::Up, ..
            } => {
                self.navigate_history_up(input);
                EditorAction::Continue
            }
            KeyEvent {
                code: KeyCode::Down,
                ..
            } => {
                self.navigate_history_down(input);
                EditorAction::Continue
            }
            KeyEvent {
                code: KeyCode::Tab, ..
            } => {
                input.complete_slash_command(&self.completions);
                EditorAction::Continue
            }
            KeyEvent {
                code: KeyCode::Home,
                ..
            } => {
                input.move_home();
                EditorAction::Continue
            }
            KeyEvent {
                code: KeyCode::End, ..
            } => {
                input.move_end();
                EditorAction::Continue
            }
            KeyEvent {
                code: KeyCode::Esc, ..
            } => {
                input.clear();
                self.history_index = None;
                self.draft = None;
                EditorAction::Cancel
            }
            KeyEvent {
                code: KeyCode::Char(ch),
                modifiers,
                ..
            } if modifiers.is_empty() || modifiers == KeyModifiers::SHIFT => {
                input.insert(ch);
                self.history_index = None;
                self.draft = None;
                EditorAction::Continue
            }
            _ => EditorAction::Continue,
        }
    }

    fn navigate_history_up(&mut self, input: &mut InputBuffer) {
        if self.history.is_empty() {
            return;
        }

        match self.history_index {
            Some(0) => {}
            Some(index) => {
                let next_index = index - 1;
                input.replace(self.history[next_index].clone());
                self.history_index = Some(next_index);
            }
            None => {
                self.draft = Some(input.as_str().to_owned());
                let next_index = self.history.len() - 1;
                input.replace(self.history[next_index].clone());
                self.history_index = Some(next_index);
            }
        }
    }

    fn navigate_history_down(&mut self, input: &mut InputBuffer) {
        let Some(index) = self.history_index else {
            return;
        };

        if index + 1 < self.history.len() {
            let next_index = index + 1;
            input.replace(self.history[next_index].clone());
            self.history_index = Some(next_index);
            return;
        }

        input.replace(self.draft.take().unwrap_or_default());
        self.history_index = None;
    }

    fn redraw(
        &self,
        out: &mut impl Write,
        input: &InputBuffer,
        previous_line_count: usize,
    ) -> io::Result<usize> {
        let rendered = render_buffer(&self.prompt, &self.continuation_prompt, input);
        if previous_line_count > 1 {
            queue!(out, MoveUp(saturating_u16(previous_line_count - 1)))?;
        }
        queue!(out, MoveToColumn(0), Clear(ClearType::FromCursorDown),)?;
        rendered.write(out)?;
        queue!(
            out,
            MoveUp(saturating_u16(rendered.line_count().saturating_sub(1))),
            MoveToColumn(0),
        )?;
        if rendered.cursor_row > 0 {
            queue!(out, MoveDown(rendered.cursor_row))?;
        }
        queue!(out, MoveToColumn(rendered.cursor_col))?;
        out.flush()?;
        Ok(rendered.line_count())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum EditorAction {
    Continue,
    Submit,
    Cancel,
    Exit,
}

#[must_use]
pub fn render_buffer(
    prompt: &str,
    continuation_prompt: &str,
    input: &InputBuffer,
) -> RenderedBuffer {
    let before_cursor = &input.as_str()[..input.cursor];
    let cursor_row = saturating_u16(before_cursor.chars().filter(|ch| *ch == '\n').count());
    let cursor_line = before_cursor.rsplit('\n').next().unwrap_or_default();
    let cursor_prompt = if cursor_row == 0 {
        prompt
    } else {
        continuation_prompt
    };
    let cursor_col = saturating_u16(cursor_prompt.chars().count() + cursor_line.chars().count());

    let mut lines = Vec::new();
    for (index, line) in input.as_str().split('\n').enumerate() {
        let prefix = if index == 0 {
            prompt
        } else {
            continuation_prompt
        };
        lines.push(format!("{prefix}{line}"));
    }
    if lines.is_empty() {
        lines.push(prompt.to_string());
    }

    RenderedBuffer {
        lines,
        cursor_row,
        cursor_col,
    }
}

#[must_use]
fn longest_common_prefix(values: &[&str]) -> String {
    let Some(first) = values.first() else {
        return String::new();
    };

    let mut prefix = (*first).to_string();
    for value in values.iter().skip(1) {
        while !value.starts_with(&prefix) {
            prefix.pop();
            if prefix.is_empty() {
                break;
            }
        }
    }
    prefix
}

#[must_use]
fn saturating_u16(value: usize) -> u16 {
    u16::try_from(value).unwrap_or(u16::MAX)
}

#[cfg(test)]
mod tests {
    use super::{render_buffer, InputBuffer, LineEditor};
    use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};

    fn key(code: KeyCode) -> KeyEvent {
        KeyEvent::new(code, KeyModifiers::NONE)
    }

    #[test]
    fn supports_basic_line_editing() {
        let mut input = InputBuffer::new();
        input.insert('h');
        input.insert('i');
        input.move_end();
        input.insert_newline();
        input.insert('x');

        assert_eq!(input.as_str(), "hi\nx");
        assert_eq!(input.cursor(), 4);

        input.move_left();
        input.backspace();
        assert_eq!(input.as_str(), "hix");
        assert_eq!(input.cursor(), 2);
    }

    #[test]
    fn completes_unique_slash_command() {
        let mut input = InputBuffer::new();
        for ch in "/he".chars() {
            input.insert(ch);
        }

        assert!(input.complete_slash_command(&[
            "/help".to_string(),
            "/hello".to_string(),
            "/status".to_string(),
        ]));
        assert_eq!(input.as_str(), "/hel");

        assert!(input.complete_slash_command(&["/help".to_string(), "/status".to_string()]));
        assert_eq!(input.as_str(), "/help");
    }

    #[test]
    fn ignores_completion_when_prefix_is_not_a_slash_command() {
        let mut input = InputBuffer::new();
        for ch in "hello".chars() {
            input.insert(ch);
        }

        assert!(!input.complete_slash_command(&["/help".to_string()]));
        assert_eq!(input.as_str(), "hello");
    }

    #[test]
    fn history_navigation_restores_current_draft() {
        let mut editor = LineEditor::new("› ", vec![]);
        editor.push_history("/help");
        editor.push_history("status report");

        let mut input = InputBuffer::new();
        for ch in "draft".chars() {
            input.insert(ch);
        }

        let _ = editor.handle_key(key(KeyCode::Up), &mut input);
        assert_eq!(input.as_str(), "status report");

        let _ = editor.handle_key(key(KeyCode::Up), &mut input);
        assert_eq!(input.as_str(), "/help");

        let _ = editor.handle_key(key(KeyCode::Down), &mut input);
        assert_eq!(input.as_str(), "status report");

        let _ = editor.handle_key(key(KeyCode::Down), &mut input);
        assert_eq!(input.as_str(), "draft");
    }

    #[test]
    fn tab_key_completes_from_editor_candidates() {
        let mut editor = LineEditor::new(
            "› ",
            vec![
                "/help".to_string(),
                "/status".to_string(),
                "/session".to_string(),
            ],
        );
        let mut input = InputBuffer::new();
        for ch in "/st".chars() {
            input.insert(ch);
        }

        let _ = editor.handle_key(key(KeyCode::Tab), &mut input);
        assert_eq!(input.as_str(), "/status");
    }

    #[test]
    fn renders_multiline_buffers_with_continuation_prompt() {
        let mut input = InputBuffer::new();
        for ch in "hello\nworld".chars() {
            if ch == '\n' {
                input.insert_newline();
            } else {
                input.insert(ch);
            }
        }

        let rendered = render_buffer("› ", "> ", &input);
        assert_eq!(
            rendered.lines(),
            &["› hello".to_string(), "> world".to_string()]
        );
        assert_eq!(rendered.cursor_position(), (1, 7));
    }

    #[test]
    fn ctrl_c_exits_only_when_buffer_is_empty() {
        let mut editor = LineEditor::new("› ", vec![]);
        let mut empty = InputBuffer::new();
        assert!(matches!(
            editor.handle_key(
                KeyEvent::new(KeyCode::Char('c'), KeyModifiers::CONTROL),
                &mut empty,
            ),
            super::EditorAction::Exit
        ));

        let mut filled = InputBuffer::new();
        filled.insert('x');
        assert!(matches!(
            editor.handle_key(
                KeyEvent::new(KeyCode::Char('c'), KeyModifiers::CONTROL),
                &mut filled,
            ),
            super::EditorAction::Cancel
        ));
        assert!(filled.as_str().is_empty());
    }
}
