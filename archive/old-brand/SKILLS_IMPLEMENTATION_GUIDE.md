# Complete Skills Implementation Guide

**Comprehensive Reference for All 373 Available Skills**

- Total Skill Entries: 373 (including duplicates)
- Unique Skills: 324
- Verified Repositories: 7
- Combined GitHub Stars: 267,349

---

## Table of Contents

1. [AI & Machine Learning Skills](#ai--machine-learning)
2. [Data Science & Analytics](#data-science--analytics)
3. [Web Development](#web-development)
4. [Mobile Development](#mobile-development)
5. [Design & UX](#design--ux)
6. [DevOps & Infrastructure](#devops--infrastructure)
7. [Testing & QA](#testing--qa)
8. [Content Creation](#content-creation)
9. [Business & Productivity](#business--productivity)
10. [Database & Storage](#database--storage)
11. [Security & Privacy](#security--privacy)
12. [Science & Research](#science--research)
13. [Finance & Economics](#finance--economics)

---

## AI & Machine Learning

### algorithmic-art
**What it does:** Generate algorithmic art and creative visualizations using mathematical algorithms

**Use Cases:**
- Creative content generation for apps
- Generative art projects
- Visual design tools
- Data visualization with artistic flair

**Implementation:**
- **Web App**: Use Canvas API with Three.js for 3D, integrate with Babylon.js for complex scenes
- **Mobile**: React Native Skia or expo-canvas for rendering algorithms
- **Backend**: Generate SVG/PNG using Python PIL, matplotlib, or ImageMagick
- **Desktop**: Electron with Canvas or native graphics libraries (OpenGL)

**Example Code (Web):**
```javascript
// Use Three.js for algorithmic 3D art
import * as THREE from 'three';
const scene = new THREE.Scene();
// Generate patterns algorithmically
```

---

### brainstorming
**What it does:** Structured brainstorming and ideation sessions with AI assistance

**Use Cases:**
- Feature ideation for products
- Problem-solving workshops
- Design thinking sessions
- Innovation sprints

**Implementation:**
- **Web App**: Create collaborative board with real-time updates, use WebSocket for sync
- **Mobile**: Mobile-friendly ideation app with voice-to-text
- **Backend**: Store ideas with tagging, search, and analytics
- **Desktop**: Standalone brainstorming tool with local storage

**Example Code (Backend):**
```python
# Store and organize brainstorming ideas
ideas = []
def add_idea(title, description, category):
    ideas.append({
        'title': title,
        'description': description,
        'category': category,
        'timestamp': datetime.now()
    })
```

---

### geniml
**What it does:** Machine learning model development framework

**Use Cases:**
- Build custom ML models
- Model training pipelines
- Experiment tracking
- Model deployment

**Implementation:**
- **Backend**: Use PyTorch, TensorFlow, or scikit-learn
- **Web App**: Create training dashboard, visualize metrics
- **Mobile**: Integrate pre-trained models for inference
- **Desktop**: Model development IDE

---

### pathml
**What it does:** Pathology machine learning tools for medical image analysis

**Use Cases:**
- Medical image analysis
- Pathology automation
- Diagnostic assistance
- Research applications

**Implementation:**
- **Backend**: Use OpenCV, scikit-image for image processing
- **Web App**: Display pathology images with annotations
- **Mobile**: Lightweight inference models
- **Desktop**: Pathology analysis tool

---

### statsmodels
**What it does:** Statistical modeling and analysis library

**Use Cases:**
- Statistical hypothesis testing
- Time series analysis
- Regression modeling
- Econometric analysis

**Implementation:**
- **Backend**: Use Python statsmodels library
- **Web App**: Display statistical results and visualizations
- **Mobile**: Show key statistics in app
- **Desktop**: Statistical analysis tool

---

## Data Science & Analytics

### exploratory-data-analysis
**What it does:** Techniques and tools for exploring and understanding data

**Use Cases:**
- Initial data understanding
- Pattern and anomaly discovery
- Data quality assessment
- Insight generation

**Implementation:**
- **Web App**: Interactive dashboards with Plotly, D3.js, or Recharts
- **Mobile**: Display key metrics and trends
- **Backend**: Pandas for data manipulation, generate summaries
- **Desktop**: Jupyter notebooks or RStudio

**Example Code (Backend):**
```python
import pandas as pd
import matplotlib.pyplot as plt

# Load and explore data
df = pd.read_csv('data.csv')
print(df.describe())
df.hist(figsize=(12, 8))
plt.show()
```

---

### statistical-analysis
**What it does:** Statistical analysis and hypothesis testing

**Use Cases:**
- A/B testing analysis
- Hypothesis validation
- Metrics analysis
- Research studies

**Implementation:**
- **Backend**: Use scipy.stats, statsmodels
- **Web App**: Visualize results with confidence intervals
- **Mobile**: Display test results
- **Desktop**: Statistical analysis tool

---

### scientific-visualization
**What it does:** Visualization techniques for scientific data

**Use Cases:**
- Research data visualization
- Publication-quality figures
- Complex data exploration
- Scientific presentations

**Implementation:**
- **Web App**: D3.js, Plotly, Vega-Lite for interactive charts
- **Mobile**: Simplified visualizations
- **Backend**: Generate visualization data
- **Desktop**: Scientific visualization software

---

### timesfm-forecasting
**What it does:** Time series forecasting with machine learning

**Use Cases:**
- Sales forecasting
- Stock price prediction
- Demand planning
- Trend analysis

**Implementation:**
- **Backend**: Use Prophet, ARIMA, or neural networks
- **Web App**: Display forecasts with confidence intervals
- **Mobile**: Show predictions in app
- **Desktop**: Forecasting tool

---

### torch-geometric
**What it does:** Graph neural network library for PyTorch

**Use Cases:**
- Social network analysis
- Molecular property prediction
- Recommendation systems
- Knowledge graph processing

**Implementation:**
- **Backend**: PyTorch Geometric for graph ML models
- **Web App**: Visualize graphs with force-directed layouts
- **Mobile**: Lightweight inference
- **Desktop**: Graph analysis tool

---

## Web Development

### frontend-design
**What it does:** Design system architecture with components, tokens, and patterns

**Use Cases:**
- Consistent UI across products
- Component library management
- Design-to-code workflow
- Accessibility standards

**Implementation:**
- **Web App**: Storybook for component documentation, Tailwind CSS for tokens
- **Mobile**: NativeWind + theme.config.js
- **Backend**: Document API schemas
- **Desktop**: Qt Designer or native UI frameworks

**Example Code (Web):**
```javascript
// Define design tokens
const tokens = {
  colors: {
    primary: '#0066cc',
    secondary: '#ff6600',
    text: '#333333'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px'
  }
};
```

---

### react-best-practices
**What it does:** React development best practices and patterns

**Use Cases:**
- React application development
- Component design patterns
- Performance optimization
- Testing strategies

**Implementation:**
- **Web App**: Apply patterns to all components, use hooks properly
- **Mobile**: Use with React Native
- **Backend**: Understand React API requirements
- **Desktop**: Use with Electron or React Native Desktop

**Key Patterns:**
- Use functional components with hooks
- Memoize expensive computations
- Implement error boundaries
- Use context for global state

---

### react-native-skills
**What it does:** React Native development patterns and best practices

**Use Cases:**
- Cross-platform mobile development
- Native feature integration
- Performance optimization
- Code reuse between platforms

**Implementation:**
- **Mobile**: Apply patterns to component architecture
- **Web**: Adapt patterns to React web
- **Backend**: Understand mobile API needs
- **Desktop**: React Native for Desktop

---

### canvas-design
**What it does:** Canvas-based graphics design and manipulation

**Use Cases:**
- Interactive drawing applications
- Data visualization
- Game development
- Image editing tools

**Implementation:**
- **Web App**: HTML5 Canvas, use Fabric.js or Konva.js
- **Mobile**: React Native Skia or Canvas
- **Backend**: Node canvas for server-side rendering
- **Desktop**: Electron with Canvas

---

### theme-factory
**What it does:** Generate and manage design themes automatically

**Use Cases:**
- Dark mode support
- Multiple theme variations
- Brand customization
- User preferences

**Implementation:**
- **Web App**: CSS variables, theme provider context, localStorage
- **Mobile**: React Context + AsyncStorage
- **Backend**: Generate theme CSS dynamically
- **Desktop**: Store themes in config files

**Example Code (Mobile):**
```typescript
// theme.config.js
const themeColors = {
  primary: { light: '#0a7ea4', dark: '#0a7ea4' },
  background: { light: '#ffffff', dark: '#151718' },
  foreground: { light: '#11181C', dark: '#ECEDEE' },
};
```

---

### web-artifacts-builder
**What it does:** Build interactive web artifacts and prototypes rapidly

**Use Cases:**
- Rapid prototyping
- Interactive demos
- Proof of concepts
- Stakeholder presentations

**Implementation:**
- **Web App**: Use Claude API to generate HTML/CSS/JS
- **Mobile**: Generate web view components
- **Backend**: Serve generated artifacts
- **Desktop**: Embed web view

---

### deploy-to-vercel
**What it does:** Deploy applications to Vercel platform

**Use Cases:**
- Web hosting
- Serverless functions
- Edge computing
- CI/CD automation

**Implementation:**
- **Web App**: Configure vercel.json, GitHub integration
- **Mobile**: Deploy backend API
- **Backend**: Deploy serverless functions
- **Desktop**: Deploy companion web service

**Setup:**
```bash
# vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "DATABASE_URL": "@database_url"
  }
}
```

---

### mcp-builder
**What it does:** Build Model Context Protocol servers for AI integration

**Use Cases:**
- AI tool integration
- API abstraction
- Agent communication
- Custom tool creation

**Implementation:**
- **Web App**: Create MCP server for web tools
- **Mobile**: Reference MCP servers
- **Backend**: Implement MCP server
- **Desktop**: Create MCP client

---

### claude-api
**What it does:** Integrate Claude API for AI-powered features

**Use Cases:**
- AI chat features
- Content generation
- Code analysis
- Data processing

**Implementation:**
- **Web App**: Use Anthropic SDK, stream to UI
- **Mobile**: Call from backend, stream responses
- **Backend**: Rate limiting, caching, error handling
- **Desktop**: Embed Claude calls

**Example Code:**
```javascript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();
const message = await client.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello!" }]
});
```

---

### doc-coauthoring
**What it does:** Enable collaborative document authoring and editing

**Use Cases:**
- Collaborative editing
- Real-time sync
- Version control
- Team documentation

**Implementation:**
- **Web App**: Use Yjs or Automerge for CRDT, WebSocket for sync
- **Mobile**: Sync with backend, conflict resolution
- **Backend**: Store versions, handle concurrent edits
- **Desktop**: Local-first sync with cloud backup

---

### docx
**What it does:** Work with DOCX documents programmatically

**Use Cases:**
- Document generation
- Report creation
- Template processing
- Batch operations

**Implementation:**
- **Web App**: Generate on server, download to client
- **Mobile**: Generate on backend, share via app
- **Backend**: Use python-docx or Node docx library
- **Desktop**: Use native DOCX libraries

**Example Code (Backend):**
```python
from docx import Document

doc = Document()
doc.add_heading('Report', 0)
doc.add_paragraph('Generated report content')
doc.save('report.docx')
```

---

### pdf
**What it does:** PDF document manipulation and generation

**Use Cases:**
- Report generation
- Invoice creation
- Document processing
- Form filling

**Implementation:**
- **Web App**: PDFKit or jsPDF on client, ReportLab on server
- **Mobile**: Generate on backend, display in app
- **Backend**: PyPDF2, reportlab, or PDFKit
- **Desktop**: Native PDF libraries

---

### pptx
**What it does:** Create and manipulate PowerPoint presentations

**Use Cases:**
- Presentation generation
- Report automation
- Slide templates
- Batch creation

**Implementation:**
- **Web App**: Generate on backend with python-pptx
- **Mobile**: Generate on backend
- **Backend**: python-pptx or Node pptx library
- **Desktop**: Native presentation libraries

---

### xlsx
**What it does:** Excel spreadsheet creation and manipulation

**Use Cases:**
- Data export
- Report generation
- Batch processing
- Data analysis

**Implementation:**
- **Web App**: Use xlsx library, server-side generation
- **Mobile**: Generate on backend, download
- **Backend**: openpyxl or node-xlsx
- **Desktop**: Native spreadsheet libraries

**Example Code (Backend):**
```python
import openpyxl

wb = openpyxl.Workbook()
ws = wb.active
ws['A1'] = 'Data'
wb.save('report.xlsx')
```

---

## Mobile Development

### react-native-skills
**What it does:** React Native development patterns and best practices

**Use Cases:**
- Cross-platform mobile apps
- Native feature integration
- Performance optimization
- Code sharing

**Implementation:**
- **Mobile**: Apply patterns to component architecture, state management
- **Web**: Adapt patterns to React
- **Backend**: Understand mobile API requirements
- **Desktop**: React Native for Desktop

**Key Patterns:**
- Use FlatList for lists (not ScrollView)
- Optimize re-renders with useMemo
- Handle platform differences
- Manage memory efficiently

---

## Design & UX

### brand-guidelines
**What it does:** Define and maintain consistent brand identity standards

**Use Cases:**
- Brand consistency
- Design system documentation
- Marketing materials
- UI/UX standards

**Implementation:**
- **Web App**: Create Figma design system, document in README
- **Mobile**: Define theme.config.js with brand colors
- **Backend**: Store brand assets in CDN
- **Desktop**: Create brand kit file

---

### oiloil-ui-ux-guide
**What it does:** Comprehensive UI/UX design guidelines

**Use Cases:**
- Design consistency
- User experience standards
- Accessibility guidelines
- Interaction patterns

**Implementation:**
- **Web App**: Document in Storybook or design wiki
- **Mobile**: Implement design system
- **Backend**: Document API response formats
- **Desktop**: UI guidelines

---

## DevOps & Infrastructure

### aws-skills
**What it does:** Amazon Web Services integration and deployment

**Use Cases:**
- Cloud hosting
- Serverless computing
- Database management
- CDN and caching

**Implementation:**
- **Web App**: Deploy to EC2, Lambda, or S3
- **Mobile**: Use AWS APIs for backend
- **Backend**: Implement AWS services
- **Desktop**: AWS CLI integration

---

### azure-devops
**What it does:** Microsoft Azure DevOps tools and integration

**Use Cases:**
- CI/CD pipelines
- Project management
- Code repositories
- Testing automation

**Implementation:**
- **Web App**: Deploy to Azure App Service
- **Mobile**: Use Azure APIs
- **Backend**: Implement Azure services
- **Desktop**: Azure integration

---

### deploy-to-vercel
**What it does:** Deploy to Vercel platform

**Use Cases:**
- Web hosting
- Serverless functions
- Edge computing
- CI/CD automation

**Implementation:**
- **Web App**: Configure vercel.json, GitHub integration
- **Mobile**: Deploy backend API
- **Backend**: Deploy serverless functions
- **Desktop**: Deploy companion web service

---

## Testing & QA

### test-driven-development
**What it does:** Test-driven development methodology

**Use Cases:**
- Quality assurance
- Code reliability
- Regression prevention
- Documentation

**Implementation:**
- **Web App**: Write tests first with Jest/Vitest, React Testing Library
- **Mobile**: Jest with React Native Testing Library
- **Backend**: Unit and integration tests
- **Desktop**: Test business logic

**Example Code:**
```javascript
describe('TaskCard', () => {
  it('should render task title', () => {
    const { getByText } = render(<TaskCard title="Test" />);
    expect(getByText('Test')).toBeInTheDocument();
  });
});
```

---

### systematic-debugging
**What it does:** Systematic approach to debugging and troubleshooting

**Use Cases:**
- Bug fixing
- Performance debugging
- Error tracking
- Root cause analysis

**Implementation:**
- **Web App**: Use DevTools, logging, error tracking (Sentry)
- **Mobile**: Use Flipper, console logs, crash reporting
- **Backend**: Structured logging, monitoring (ELK stack)
- **Desktop**: Debuggers, log files

---

### code-review
**What it does:** Code review best practices and processes

**Use Cases:**
- Quality control
- Knowledge sharing
- Standards enforcement
- Team learning

**Implementation:**
- **Web App**: GitHub PR reviews, automated checks (ESLint, Prettier)
- **Mobile**: Code review process
- **Backend**: Enforce review standards
- **Desktop**: Team code review workflow

---

### webapp-testing
**What it does:** Comprehensive web application testing strategies

**Use Cases:**
- Quality assurance
- Test coverage
- CI/CD pipelines
- Regression testing

**Implementation:**
- **Web App**: Jest, React Testing Library, Cypress, Playwright
- **Mobile**: Detox, Jest, React Native Testing Library
- **Backend**: Jest, Supertest, test databases
- **Desktop**: Spectron, Playwright

---

## Content Creation

### scientific-writing
**What it does:** Academic and scientific writing assistance

**Use Cases:**
- Research papers
- Technical documentation
- Academic articles
- Scientific reports

**Implementation:**
- **Web App**: Create writing assistant interface
- **Mobile**: Mobile-friendly writing app
- **Backend**: Implement writing suggestions
- **Desktop**: Standalone writing tool

---

### content-research-writer
**What it does:** Research-based content generation

**Use Cases:**
- Blog posts
- Research articles
- Documentation
- Content marketing

**Implementation:**
- **Web App**: Create content generation interface
- **Mobile**: Mobile writing app
- **Backend**: Implement research and writing logic
- **Desktop**: Content creation tool

---

### video-downloader
**What it does:** Download videos from various sources

**Use Cases:**
- Video archiving
- Offline viewing
- Content management
- Research

**Implementation:**
- **Web App**: Use yt-dlp or similar backend
- **Mobile**: Implement video download feature
- **Backend**: Handle downloads, storage
- **Desktop**: Standalone downloader

---

## Business & Productivity

### writing-plans
**What it does:** Planning and task breakdown methodology

**Use Cases:**
- Project planning
- Feature breakdown
- Sprint planning
- Task management

**Implementation:**
- **Web App**: Create project management interface
- **Mobile**: Build task management app
- **Backend**: Implement project/task APIs
- **Desktop**: Project planning tool

---

### brainstorming
**What it does:** Structured brainstorming sessions

**Use Cases:**
- Feature ideation
- Problem solving
- Design thinking
- Innovation

**Implementation:**
- **Web App**: Collaborative brainstorming board
- **Mobile**: Mobile-friendly ideation app
- **Backend**: Store and organize ideas
- **Desktop**: Brainstorming tool

---

## Database & Storage

### postgres
**What it does:** PostgreSQL database management

**Use Cases:**
- Relational data storage
- Complex queries
- Data integrity
- Scalability

**Implementation:**
- **Backend**: Use with Prisma, Sequelize, or TypeORM
- **Web App**: Connect via backend API
- **Mobile**: Connect via backend API
- **Desktop**: Connect via backend API

---

### mysql
**What it does:** MySQL database management

**Use Cases:**
- Web application databases
- Content management
- User data storage
- Analytics

**Implementation:**
- **Backend**: Use with Sequelize or TypeORM
- **Web App**: Connect via backend API
- **Mobile**: Connect via backend API
- **Desktop**: Connect via backend API

---

### mssql
**What it does:** Microsoft SQL Server management

**Use Cases:**
- Enterprise databases
- Complex transactions
- Data warehousing
- Business intelligence

**Implementation:**
- **Backend**: Use with Sequelize or TypeORM
- **Web App**: Connect via backend API
- **Mobile**: Connect via backend API
- **Desktop**: Connect via backend API

---

## Security & Privacy

### Trail of Bits Security Skills
**What it does:** Advanced security analysis and best practices

**Use Cases:**
- Security auditing
- Vulnerability assessment
- Penetration testing
- Security training

**Implementation:**
- **Web App**: Implement security best practices
- **Mobile**: Secure data storage and transmission
- **Backend**: Implement authentication, encryption
- **Desktop**: Security hardening

---

## Science & Research

### scientific-brainstorming
**What it does:** AI-assisted scientific ideation

**Use Cases:**
- Research ideation
- Hypothesis generation
- Experiment design
- Problem solving

**Implementation:**
- **Backend**: Use Claude API for suggestions
- **Web App**: Display research ideas
- **Mobile**: Research ideation app
- **Desktop**: Scientific ideation tool

---

### scientific-visualization
**What it does:** Visualization for scientific data

**Use Cases:**
- Research visualization
- Publication figures
- Data exploration
- Scientific presentations

**Implementation:**
- **Web App**: D3.js, Plotly, Vega-Lite
- **Mobile**: Simplified visualizations
- **Backend**: Generate visualization data
- **Desktop**: Scientific visualization software

---

## Finance & Economics

### fred-economic-data
**What it does:** Federal Reserve economic data access

**Use Cases:**
- Economic analysis
- Market research
- Financial forecasting
- Policy analysis

**Implementation:**
- **Backend**: Use FRED API
- **Web App**: Display economic indicators
- **Mobile**: Show key metrics
- **Desktop**: Economic analysis tool

---

## Integration Patterns

### Recommended Combinations by Project Type

**Mobile Task Manager:**
- react-native-skills
- frontend-design
- test-driven-development
- statistical-analysis
- theme-factory

**E-Commerce Platform:**
- react-best-practices
- frontend-design
- test-driven-development
- deploy-to-vercel
- postgres
- stripe-integration (if available)

**Data Analytics Dashboard:**
- exploratory-data-analysis
- scientific-visualization
- statistical-analysis
- frontend-design
- deploy-to-vercel

**Scientific Research Tool:**
- scientific-brainstorming
- scientific-visualization
- statistical-analysis
- exploratory-data-analysis
- pdf (for report generation)

**Content Management System:**
- react-best-practices
- doc-coauthoring
- frontend-design
- postgres
- deploy-to-vercel

---

## Implementation Checklist

When implementing a new project:

1. **Select Core Skills** (2-3)
   - Choose skills aligned with project type
   - Reference implementation guides

2. **Add Development Skills** (2-3)
   - test-driven-development
   - systematic-debugging
   - code-review

3. **Integrate Data/Analytics** (1-2)
   - exploratory-data-analysis
   - statistical-analysis

4. **Add Deployment** (1)
   - deploy-to-vercel or equivalent

5. **Document & Review**
   - Use writing-plans for documentation
   - Implement code-review process

---

## Resources

- **Anthropics/skills**: https://github.com/anthropics/skills
- **K-Dense-AI/claude-scientific-skills**: https://github.com/K-Dense-AI/claude-scientific-skills
- **Vercel Labs**: https://github.com/vercel-labs/agent-skills
- **Obra/superpowers**: https://github.com/obra/superpowers

---

**Last Updated:** March 12, 2026  
**Total Skills Documented:** 324 unique skills  
**Total Entries:** 373 (including duplicates)
