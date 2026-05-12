"use strict";

// Slideout Menu
document.addEventListener("DOMContentLoaded", () => {
    const menu = new Mmenu(
        "#menu",
        {
            // options
            slidingSubmenus: true,
            navbar: {
                add: true,
                title: "Menu",
                close: true,
            },
            offCanvas: {
                position: "right",
            },
            theme: "white-contrast",
            counters: {
                add: true,
            },
            pageScroll: {
                scroll: true,
                update: true,
            },
        },
        {
            // configuration
            classNames: {
                selected: "active",
            },
            offCanvas: {
                page: {
                    selector: "#page",
                },
            },
            onClick: {
                close: true, // <- close menu on click
            },
        }
    );

    // Get the menu API
    const api = menu.API;

    // Select the mburger button
    const btn = document.getElementById("menu-toggle");

    // Add button animation when the menu opens/closes
    api.bind("open:start", () => btn.classList.add("is-active"));
    api.bind("close:start", () => btn.classList.remove("is-active"));
});

// FAQ
$(".faq_question").click(function (e) {
    if (!$(this).parents(".faq_row").hasClass("faq_active")) {
        $(".faq_row").removeClass("faq_active");
        $(".faq_answer").slideUp(500);
    }
    $(this).parents(".faq_row").toggleClass("faq_active");
    $(this).parents(".faq_row").find(".faq_answer").slideToggle(500);
});

// VIDEO POPUP
$(".video-link").magnificPopup({
    type: "iframe",
    mainClass: "mfp-fade",
    preloader: false,
    fixedContentPos: true,
});

// Stop popup scrolling
$(".video-link").on("click", function (e) {
    e.stopPropagation();
});

// Toggle Sub-links
document.addEventListener("DOMContentLoaded", () => {
    const dropLinks = document.querySelectorAll(".drop-link");
    const subLinks = document.querySelectorAll(".sub-links");

    function handleDropdowns() {
        if (window.innerWidth >= 1440) {
            dropLinks.forEach((dropLink) => {
                dropLink.addEventListener("mouseenter", () => {
                    const currentSubLinks = dropLink.nextElementSibling;
                    subLinks.forEach((sub) => {
                        if (sub !== currentSubLinks) {
                            sub.style.display = "none";
                        }
                    });
                    currentSubLinks.style.display = "block";
                });

                dropLink.addEventListener("mouseleave", () => {
                    const currentSubLinks = dropLink.nextElementSibling;
                    setTimeout(() => {
                        if (!currentSubLinks.matches(":hover") && !dropLink.matches(":hover")) {
                            currentSubLinks.style.display = "none";
                        }
                    }, 200);
                });
            });

            subLinks.forEach((subLink) => {
                subLink.addEventListener("mouseleave", () => {
                    setTimeout(() => {
                        if (!subLink.matches(":hover")) {
                            subLink.style.display = "none";
                        }
                    }, 200);
                });
            });
        } else {
            // Reset styles for larger screens
            subLinks.forEach((sub) => {
                sub.style.display = "";
            });
        }
    }

    handleDropdowns();
    window.addEventListener("resize", handleDropdowns);
});

// CTA Scroll
const ctaButtons = document.querySelectorAll(".scroll");
ctaButtons.forEach(function (ctaButton) {
    ctaButton.addEventListener("click", function (e) {
        e.preventDefault();
        const formHolder = document.querySelector("#form-holder");
        formHolder.scrollIntoView({ behavior: "smooth" });
    });
});

$(document).ready(function () {
    // Example starter JavaScript for disabling form submissions if there are invalid fields
    (function () {
        "use strict";

        // Fetch all the forms we want to apply custom Bootstrap validation styles to
        var forms = document.querySelectorAll(".needs-validation");

        // Loop over them and prevent submission
        Array.prototype.slice.call(forms).forEach(function (form) {
            form.addEventListener(
                "submit",
                function (event) {
                    if (!form.checkValidity()) {
                        event.preventDefault();
                        event.stopPropagation();
                    }

                    form.classList.add("was-validated");
                },
                false
            );
        });
    })();

    var $testimonialSlider = $(".testimonial-slider");

    if ($testimonialSlider.length) {
        $testimonialSlider.slick({
            slidesToShow: 1,
            arrows: true,
            prevArrow: '<button class="slick-prev"><img src="/site/images/arrow-left-black.svg" alt="Prev"></button>',
            nextArrow: '<button class="slick-next"><img src="/site/images/arrow-right-black.svg" alt="Next"></button>',
            adaptiveHeight: true,
            autoplay: true,
            autoplaySpeed: 5000,
            dots: true,
            customPaging: function (slider, i) {
                // Find the corresponding .testimonial .author-img img
                var img = $(slider.$slides[i]).find(".author-img img");
                var src = img.attr("src");
                var alt = img.attr("alt") || "";
                return (
                    '<img class="slick-dot-thumb" src="' +
                    src +
                    '" alt="' +
                    alt +
                    '" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">'
                );
            },
            responsive: [
                {
                    breakpoint: 480,
                    settings: {
                        dots: false,
                    },
                },
            ],
        });
    }
});

// Get Referral URL
var inputElement = document.getElementById("Field10");
var currentURL = window.location.href;

if (inputElement) {
    inputElement.value = currentURL;
}

function equalizeBoxTopHeights() {
    const boxes = document.querySelectorAll(".box");
    if (!boxes.length) return; // Exit if no .box elements found

    const rowMap = new Map();

    // Reset previous heights
    boxes.forEach((box) => {
        const topEl = box.querySelector(".box-top");
        if (topEl) topEl.style.height = "auto";
    });

    // Group boxes by row (same top offset)
    boxes.forEach((box) => {
        const topEl = box.querySelector(".box-top");
        if (!topEl) return;

        const top = box.getBoundingClientRect().top;
        const group = rowMap.get(top) || [];
        group.push(box);
        rowMap.set(top, group);
    });

    // Equalize heights within each row
    rowMap.forEach((group) => {
        const maxHeight = Math.max(
            ...group.map((box) => {
                const topEl = box.querySelector(".box-top");
                return topEl ? topEl.offsetHeight : 0;
            })
        );
        group.forEach((box) => {
            const topEl = box.querySelector(".box-top");
            if (topEl) topEl.style.height = maxHeight + "px";
        });
    });
}

window.addEventListener("load", equalizeBoxTopHeights);
window.addEventListener("resize", equalizeBoxTopHeights);
