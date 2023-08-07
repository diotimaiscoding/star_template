import $ from "https://v2.blissfuljs.com/src/$.js";
import $$ from "https://v2.blissfuljs.com/src/$$.js";
import create from "https://v2.blissfuljs.com/src/dom/create.js";
import load from "https://v2.blissfuljs.com/src/async/load.js";

import "https://md-block.verou.me/md-block.js";

window.$ = $;
window.$$ = $$;

document.documentElement.style.setProperty("--random", Math.random());

function onScroll () {
	let {scrollY, innerHeight} = window;
	document.documentElement.style.setProperty("--scroll-y", scrollY);
	document.documentElement.classList.toggle("scrolled", scrollY > 0);

	let {scrollTop, scrollHeight, clientHeight} = document.documentElement;
	let scrollTotal = scrollHeight - clientHeight;
	// Use a Back to Top button for pages longer than 4 screens; the user has already scrolled half of it.
	// For detail, see https://www.nngroup.com/articles/back-to-top/
	let showButton = scrollTotal > 4 * innerHeight && scrollTop / scrollTotal > 0.5;
	document.documentElement.classList.toggle("back-to-top", showButton);
}
document.addEventListener("scroll", onScroll);
$("#back-to-top").addEventListener("click", () => {
	let motionQuery = matchMedia("(prefers-reduced-motion)");

	document.documentElement.scrollTo({
		top: 0,
		behavior: motionQuery.matches ? "auto" : "smooth"
	});
});
onScroll();

// Workaround for Gecko bugs #1313757 #1571244
let monitoredRectsSelector = "main h2";
let monitoredRects = new WeakSet();
let visibleRects = new Set();

window.monitoredRects = monitoredRects;
window.visibleRects = visibleRects;

let visibilityObserver = new IntersectionObserver(entries => {
	for (let entry of entries) {
		let el = entry.target;

		if (entry.isIntersecting) {
			visibleRects.add(el);
			rectSizeObserver.observe(el);
			updateRect(el);
		}
		else {
			visibleRects.delete(el);
			rectSizeObserver.unobserve(el);
		}
	}
});

for (let el of $$(monitoredRectsSelector)) {
	monitoredRects.add(el);
	visibilityObserver.observe(el);
}

// Monitor for new elements
let newElementsObserver = new MutationObserver(records => {
	for (let record of records) {
		// Monitor newly added elements
		for (let el of record.addedNodes) {
			if (el.nodeType === Node.ELEMENT_NODE && el.matches(monitoredRectsSelector)) {
				monitoredRects.add(el);
				visibilityObserver.observe(el);
			}
		}

		// Cleanup removed elements
		for (let el of record.removedNodes) {
			if (el.nodeType === Node.ELEMENT_NODE) {
				monitoredRects.delete(el);
				visibilityObserver.unobserve(el);
			}
		}
	}
});

newElementsObserver.observe(document.documentElement, {childList: true, subtree: true});

// Monitor elements for size changes
let rectSizeObserver = new ResizeObserver(records => {
	for (let record of records) {
		if (visibleRects.has(record.target)) {
			updateRect(record.target);
		}
	}
});

function updateRect(el) {
	let rect = el.getBoundingClientRect();
	for (let prop in rect) {
		el.style.setProperty("--" + prop, rect[prop] + "px");
	}
}

function updateVisibleRects() {
	for (let el of visibleRects) {
		updateRect(el);
	}
}

// Update rects when window is scrolled or resized
document.addEventListener("scroll", updateVisibleRects);
window.addEventListener("resize", updateVisibleRects);