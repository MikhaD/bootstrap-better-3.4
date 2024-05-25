(() => {
	// if (!String(document.location).startsWith("https://getbootstrap.com/docs/3.4/customize/")) document.location = "https://getbootstrap.com/docs/3.4/customize/";
	if (window.bb_modified) return;
	window.bb_modified = true;
	/**
	 * @param {string} value
	 * @returns {Clr | Var | Fn | {type: "invalid"}}
	 */
	function parse(value) {
		value = value.trim();
		if (/^#([0-9a-fA-F]{3,4}){1,2}$/.test(value)) return { type: "color", data: value };
		if (value.startsWith("@") && value.indexOf(" ") === -1) return { type: "variable", data: value };
		if (value.startsWith("lighten") || value.startsWith("darken")) {
			const start = value.indexOf("(");
			const data = value.slice(start + 1, -1).split(",");
			let percentage = data.pop();
			if (percentage.endsWith("%") && !isNaN(percentage.slice(0, -1))) {
				return {
					type: "function", data: {
						function: value.slice(0, start),
						percent: Number(percentage.slice(0, -1)),
						param: data.join(","),
					}
				};
			}
		}
		return { type: "invalid" };
	}

	class Color {
		/**
		 * @param {number} r
		 * @param {number} g
		 * @param {number} b
		 * @param {number} a
		 */
		constructor(r, g, b, a = 100) {
			this.r = r;
			this.g = g;
			this.b = b;
			this.a = a;
		}
		/**
		 * Create a Color object from a hex color string.
		 * @param {string} hex
		 */
		static fromHEX(hex) {
			if (hex.startsWith("#")) hex = hex.slice(1);
			if (hex.length === 3 || hex.length === 4) {
				hex = hex
					.split("")
					.map((c) => c + c)
					.join("");
			}
			if (hex.length === 6) hex += "FF";
			return new Color(
				parseInt(hex.slice(0, 2), 16),
				parseInt(hex.slice(2, 4), 16),
				parseInt(hex.slice(4, 6), 16),
				parseInt(hex.slice(6, 8), 16) / 2.55,
			);
		}

		static fromHSL(h, s, l) {
			let r, g, b;
			h %= 360;
			s /= 100;
			l /= 100;
			const c = (1 - Math.abs(2 * l - 1)) * s;
			const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
			const m = l - c / 2;
			if (h < 60) {
				[r, g, b] = [c, x, 0];
			} else if (h < 120) {
				[r, g, b] = [x, c, 0];
			} else if (h < 180) {
				[r, g, b] = [0, c, x];
			} else if (h < 240) {
				[r, g, b] = [0, x, c];
			} else if (h < 300) {
				[r, g, b] = [x, 0, c];
			} else {
				[r, g, b] = [c, 0, x];
			}
			return new Color(
				(r + m) * 255,
				(g + m) * 255,
				(b + m) * 255,
			);
		}

		/** Whether this is considered a dark color (text on it should be light) */
		get is_dark() {
			return this.asHSL()[2] < 50;
		}

		asHSL() {
			return Color.RGBtoHSL(this.r, this.g, this.b);
		}

		asHEX() {
			return Color.RGBtoHEX(this.r, this.g, this.b, this.a);
		}

		/**
		 * Lighten the color by a given percentage.
		 * @param {number} percent - The percentage to lighten the color by.
		 */
		lighten(percent) {
			const [h, s, l] = this.asHSL();
			return Color.fromHSL(h, s, Math.min(100, l + percent));
		}

		/**
		 * Darken the color by a given percentage.
		 * @param {number} percentage - The percentage to darken the color by.
		 */
		darken(percentage) {
			const [h, s, l] = this.asHSL();
			return Color.fromHSL(h, s, Math.max(0, l - percentage));
		}

		/**
		 * Take r g and b values and return the hue.
		 * @param {number} r
		 * @param {number} g
		 * @param {number} b
		 */
		static #calculateHue(r, g, b) {
			const max = Math.max(r, g, b);
			const min = Math.min(r, g, b);
			const delta = max - min;
			let h = 0;
			switch (max) {
				case r: h = ((g - b) / delta) % 6; break;
				case g: h = (b - r) / delta + 2; break;
				case b: h = (r - g) / delta + 4; break;
			}
			return ((h * 60) + 360) % 360;
		}
		/**
		 * Convert a color in RGB format to HSL format.
		 * @param {number} r - Red value (0-255).
		 * @param {number} g - Green value (0-255).
		 * @param {number} b - Blue value (0-255).
		 * @returns {ColorTuple}
		 */
		static RGBtoHSL(r, g, b) {
			r /= 255;
			g /= 255;
			b /= 255;
			const max = Math.max(r, g, b);
			const min = Math.min(r, g, b);
			const delta = max - min;
			let h = 0;
			let s = 0;
			let l = (max + min) / 2;
			if (delta !== 0) {
				s = l < 0.5 ? delta / (max + min) : delta / (2 - max - min);
				h = Color.#calculateHue(r, g, b);
			}
			return [h, s * 100, l * 100];
		}
		/**
		 * Convert a color in RGB(A) format to a hex string with alpha if alpha isn't max.
		 * @param {number} r - Red value (0-255)
		 * @param {number} g - Green value (0-255)
		 * @param {number} b - Blue value (0-255)
		 * @param {number} a - Optional alpha value (0-100). Defaults to 100. If the value is 100, the alpha
		 * channel will be omitted.
		 */
		static RGBtoHEX(r, g, b, a = 100) {
			return "#" + (
				Math.round(r).toString(16).padStart(2, "0") +
				Math.round(g).toString(16).padStart(2, "0") +
				Math.round(b).toString(16).padStart(2, "0") +
				(a < 100 ? Math.round(a * 2.55).toString(16).padStart(2, "0") : "")
			).toUpperCase();
		}
	}


	class Model {
		/** @type {Map<string, Model} */
		static models = new Map();
		/** @type {string} */
		#value;
		/** @type {Color | null} */
		#color;
		/**
		 * Create a new Model of an input
		 * @param {string} id
		 * @param {HTMLInputElement} node
		 */
		constructor(id, node) {
			Model.models.set(id, this);
			this.id = id;
			this.node = node;
			/** @type {Model | null} */
			this.subscription = null;
			/** @type {Set<Model>} */
			this.subscribers = new Set();
			this.filters = [];

			this.value = node.value;
		}
		/** @param {string} data */
		set value(data) {
			if (this.#value === data) return;
			this.unsubscribe();
			this.filters = [];
			this.#value = data;
			this._processValue(data);
		}
		get value() { return this.#value; };

		/** @param {string} data */
		_processValue(data) {
			const value = parse(data);
			switch (value.type) {
				case "color": {
					this.color = Color.fromHEX(value.data);
					break;
				}
				case "function": {
					this.filters.push([value.data.function, value.data.percent]);
					this._processValue(value.data.param);
					break;
				}
				case "variable": {
					const dependency = Model.models.get(value.data);
					if (dependency && dependency !== this) {
						this.subscribeTo(dependency);
						break;
					}
				}
				default: {
					this.color = null;
				}
			}
		}

		/** @param {Color | null} value  */
		set color(value) {
			this.#color = value;
			const thisColor = this.color;
			if (thisColor) {
				let style = `background-color: ${thisColor.asHEX()};`;
				if (thisColor.is_dark) style += "color: white;";
				this.node.style = style;
			} else {
				this.node.style = "";
			}
			for (const sub of this.subscribers) {
				sub.color = thisColor;
			}
		}
		get color() {
			if (this.#color === null) return null;

			let color = this.#color;
			for (const [fn, percent] of this.filters) {
				switch (fn) {
					case "lighten": {
						color = color.lighten(percent);
						break;
					}
					case "darken": {
						color = color.darken(percent);
						break;
					}
				}
			}
			return color;
		}
		/**
		 * Subscribe to another model. This model's color value depends on the color of the subscribed to model
		 * @param {Model} other
		 */
		subscribeTo(other) {
			if (this.subscription === other) return;
			this.unsubscribe();
			other._addSubscriber(this);
			this.subscription = other;
		}
		/**
		 * If this model is subscribed to another, unsubscribe from it
		 */
		unsubscribe() {
			if (this.subscription) {
				this.subscription._removeSubscriber(this);
				this.subscription = null;
			}
		}
		/**
		 * Called when another model subscribes to this one
		 * @param {Model} other
		 */
		_addSubscriber(other) {
			this.subscribers.add(other);
			other.color = this.color;
		}
		/**
		 * Called when another model unsubscribes from this one
		 * @param {Model} other
		 */
		_removeSubscriber(other) {
			this.subscribers.delete(other);
		}
	}


	for (const input of document.querySelectorAll("input[type='text'].form-control")) {
		input.model = new Model(input.getAttribute("data-var"), input);
		input.addEventListener("change", function() {
			this.model.value = this.value;
		});
	}
})();
// const script = document.createElement("script");
// script.onload = function() {
// 	console.log("eet worked!");
// };
// document.body.appendChild(script);