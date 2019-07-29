
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var Jsecaptcha = (function () {
    'use strict';

    function noop() {}

    function add_location(element, file, line, column, char) {
      element.__svelte_meta = {
        loc: {
          file,
          line,
          column,
          char
        }
      };
    }

    function run(fn) {
      return fn();
    }

    function blank_object() {
      return Object.create(null);
    }

    function run_all(fns) {
      fns.forEach(run);
    }

    function is_function(thing) {
      return typeof thing === 'function';
    }

    function safe_not_equal(a, b) {
      return a != a ? b == b : a !== b || a && typeof a === 'object' || typeof a === 'function';
    }

    function append(target, node) {
      target.appendChild(node);
    }

    function insert(target, node, anchor) {
      target.insertBefore(node, anchor || null);
    }

    function detach(node) {
      node.parentNode.removeChild(node);
    }

    function destroy_each(iterations, detaching) {
      for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i]) iterations[i].d(detaching);
      }
    }

    function element(name) {
      return document.createElement(name);
    }

    function svg_element(name) {
      return document.createElementNS('http://www.w3.org/2000/svg', name);
    }

    function text(data) {
      return document.createTextNode(data);
    }

    function space() {
      return text(' ');
    }

    function listen(node, event, handler, options) {
      node.addEventListener(event, handler, options);
      return () => node.removeEventListener(event, handler, options);
    }

    function attr(node, attribute, value) {
      if (value == null) node.removeAttribute(attribute);else node.setAttribute(attribute, value);
    }

    function children(element) {
      return Array.from(element.childNodes);
    }

    function set_style(node, key, value) {
      node.style.setProperty(key, value);
    }

    function select_option(select, value) {
      for (let i = 0; i < select.options.length; i += 1) {
        const option = select.options[i];

        if (option.__value === value) {
          option.selected = true;
          return;
        }
      }
    }

    function select_value(select) {
      const selected_option = select.querySelector(':checked') || select.options[0];
      return selected_option && selected_option.__value;
    }

    function toggle_class(element, name, toggle) {
      element.classList[toggle ? 'add' : 'remove'](name);
    }

    function custom_event(type, detail) {
      const e = document.createEvent('CustomEvent');
      e.initCustomEvent(type, false, false, detail);
      return e;
    }

    let current_component;

    function set_current_component(component) {
      current_component = component;
    }

    function get_current_component() {
      if (!current_component) throw new Error(`Function called outside component initialization`);
      return current_component;
    }

    function onMount(fn) {
      get_current_component().$$.on_mount.push(fn);
    }

    function createEventDispatcher() {
      const component = current_component;
      return (type, detail) => {
        const callbacks = component.$$.callbacks[type];

        if (callbacks) {
          // TODO are there situations where events could be dispatched
          // in a server (non-DOM) environment?
          const event = custom_event(type, detail);
          callbacks.slice().forEach(fn => {
            fn.call(component, event);
          });
        }
      };
    }

    const dirty_components = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];

    function schedule_update() {
      if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
      }
    }

    function add_render_callback(fn) {
      render_callbacks.push(fn);
    }

    function flush() {
      const seen_callbacks = new Set();

      do {
        // first, call beforeUpdate functions
        // and update components
        while (dirty_components.length) {
          const component = dirty_components.shift();
          set_current_component(component);
          update(component.$$);
        }

        while (binding_callbacks.length) binding_callbacks.shift()(); // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...


        while (render_callbacks.length) {
          const callback = render_callbacks.pop();

          if (!seen_callbacks.has(callback)) {
            callback(); // ...so guard against infinite loops

            seen_callbacks.add(callback);
          }
        }
      } while (dirty_components.length);

      while (flush_callbacks.length) {
        flush_callbacks.pop()();
      }

      update_scheduled = false;
    }

    function update($$) {
      if ($$.fragment) {
        $$.update($$.dirty);
        run_all($$.before_render);
        $$.fragment.p($$.dirty, $$.ctx);
        $$.dirty = null;
        $$.after_render.forEach(add_render_callback);
      }
    }

    let outros;

    function group_outros() {
      outros = {
        remaining: 0,
        callbacks: []
      };
    }

    function check_outros() {
      if (!outros.remaining) {
        run_all(outros.callbacks);
      }
    }

    function on_outro(callback) {
      outros.callbacks.push(callback);
    }

    function mount_component(component, target, anchor) {
      const {
        fragment,
        on_mount,
        on_destroy,
        after_render
      } = component.$$;
      fragment.m(target, anchor); // onMount happens after the initial afterUpdate. Because
      // afterUpdate callbacks happen in reverse order (inner first)
      // we schedule onMount callbacks before afterUpdate callbacks

      add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);

        if (on_destroy) {
          on_destroy.push(...new_on_destroy);
        } else {
          // Edge case - component was destroyed immediately,
          // most likely as a result of a binding initialising
          run_all(new_on_destroy);
        }

        component.$$.on_mount = [];
      });
      after_render.forEach(add_render_callback);
    }

    function destroy(component, detaching) {
      if (component.$$) {
        run_all(component.$$.on_destroy);
        component.$$.fragment.d(detaching); // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)

        component.$$.on_destroy = component.$$.fragment = null;
        component.$$.ctx = {};
      }
    }

    function make_dirty(component, key) {
      if (!component.$$.dirty) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty = blank_object();
      }

      component.$$.dirty[key] = true;
    }

    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
      const parent_component = current_component;
      set_current_component(component);
      const props = options.props || {};
      const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props: prop_names,
        update: noop,
        not_equal: not_equal$$1,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_render: [],
        after_render: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty: null
      };
      let ready = false;
      $$.ctx = instance ? instance(component, props, (key, value) => {
        if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
          if ($$.bound[key]) $$.bound[key](value);
          if (ready) make_dirty(component, key);
        }
      }) : props;
      $$.update();
      ready = true;
      run_all($$.before_render);
      $$.fragment = create_fragment($$.ctx);

      if (options.target) {
        if (options.hydrate) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          $$.fragment.l(children(options.target));
        } else {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          $$.fragment.c();
        }

        if (options.intro && component.$$.fragment.i) component.$$.fragment.i();
        mount_component(component, options.target, options.anchor);
        flush();
      }

      set_current_component(parent_component);
    }

    class SvelteComponent {
      $destroy() {
        destroy(this, true);
        this.$destroy = noop;
      }

      $on(type, callback) {
        const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
        callbacks.push(callback);
        return () => {
          const index = callbacks.indexOf(callback);
          if (index !== -1) callbacks.splice(index, 1);
        };
      }

      $set() {// overridden by instance, if it has props
      }

    }

    class SvelteComponentDev extends SvelteComponent {
      constructor(options) {
        if (!options || !options.target && !options.$$inline) {
          throw new Error(`'target' is a required option`);
        }

        super();
      }

      $destroy() {
        super.$destroy();

        this.$destroy = () => {
          console.warn(`Component was already destroyed`); // eslint-disable-line no-console
        };
      }

    }

    /* src\components\Asteroids.svelte generated by Svelte v3.5.1 */

    const file = "src\\components\\Asteroids.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.ele = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (5:1) {#each gameElement as ele, i}
    function create_each_block(ctx) {
    	var div, dispose;

    	function click_handler() {
    		return ctx.click_handler(ctx);
    	}

    	return {
    		c: function create() {
    			div = element("div");
    			div.draggable = draggable;
    			div.className = "gfx";
    			set_style(div, "transform", "rotate(" + ctx.ele.r + "deg)");
    			set_style(div, "top", "" + ctx.ele.y + "px");
    			set_style(div, "left", "" + ctx.ele.x + "px");
    			toggle_class(div, "active", (ctx.ele.type === 'asteroid')?ctx.ele.smashed:false);
    			toggle_class(div, "asteroid", (ctx.ele.type === 'asteroid'));
    			toggle_class(div, "spaceship", (ctx.ele.type === 'spaceShip'));
    			add_location(div, file, 5, 2, 235);
    			dispose = listen(div, "click", click_handler, { once: true });
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    		},

    		p: function update_1(changed, new_ctx) {
    			ctx = new_ctx;
    			if (changed.gameElement) {
    				set_style(div, "transform", "rotate(" + ctx.ele.r + "deg)");
    				set_style(div, "top", "" + ctx.ele.y + "px");
    				set_style(div, "left", "" + ctx.ele.x + "px");
    				toggle_class(div, "active", (ctx.ele.type === 'asteroid')?ctx.ele.smashed:false);
    				toggle_class(div, "asteroid", (ctx.ele.type === 'asteroid'));
    				toggle_class(div, "spaceship", (ctx.ele.type === 'spaceShip'));
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			dispose();
    		}
    	};
    }

    function create_fragment(ctx) {
    	var div, dispose;

    	var each_value = ctx.gameElement;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			div = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			div.id = "JSE-game";
    			div.className = "game";
    			add_location(div, file, 3, 0, 81);

    			dispose = [
    				listen(div, "click", ctx.captchaClick),
    				listen(div, "mousemove", ctx.moveSpaceship),
    				listen(div, "touchmove", ctx.moveSpaceship)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},

    		p: function update_1(changed, ctx) {
    			if (changed.draggable || changed.gameElement) {
    				each_value = ctx.gameElement;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_each(each_blocks, detaching);

    			run_all(dispose);
    		}
    	};
    }

    const draggable = false;

    function instance($$self, $$props, $$invalidate) {
    	//Events
    	const dispatch = createEventDispatcher();

    	//Data model
    	const mlData = { mouseClicks:0 };

    	//Timer
    	let update = null;

    	//game elements
    	const gameElement = [{
    			x: 20,
    			y: 130,
    			r: 45,
    			type: 'spaceShip',
    		},{
    			x: 230,
    			y: 20,
    			r: 0,
    			type: 'asteroid',
    			smashed: false,
    		},{
    			x: 230,
    			y: 120,
    			r: 0,
    			type: 'asteroid',
    			smashed: false,
    		},{
    			x: 130,
    			y: 70,
    			r: 0,
    			type: 'asteroid',
    			smashed: false,
    		}];

    	//smash android
    	const smash = (i) => {
    		gameElement[i].smashed = true; $$invalidate('gameElement', gameElement);
    		
    		captchaClick();

    		if ((gameElement[1].smashed) && (gameElement[2].smashed) && (gameElement[3].smashed)) {
    			gameCompleted();
    			clearInterval(update);
    		}
    	};

    	//move spaceship
    	const moveSpaceship = (e) => {
    		const rect = e.currentTarget.getBoundingClientRect();
    		const mouseX = e.pageX - rect.left;
    		const mouseY = e.pageY - rect.top;

    		gameElement[0].r = Math.atan2(mouseY - gameElement[0].y, mouseX - gameElement[0].x) * (180 / Math.PI) + 85; $$invalidate('gameElement', gameElement);
    	};

    	const draw = () => {
    		gameElement[1].x -= 6; $$invalidate('gameElement', gameElement);
    		if (gameElement[1].x <= 0) { gameElement[1].x = 290; $$invalidate('gameElement', gameElement); }
    		gameElement[1].r += 5; $$invalidate('gameElement', gameElement);

    		gameElement[2].y -= 3; $$invalidate('gameElement', gameElement);
    		if (gameElement[2].y <= 0) { gameElement[2].y = 190; $$invalidate('gameElement', gameElement); }
    		gameElement[2].r -= 3; $$invalidate('gameElement', gameElement);

    		gameElement[3].x -= 3; $$invalidate('gameElement', gameElement);
    		gameElement[3].y -= 3; $$invalidate('gameElement', gameElement);
    		if (gameElement[3].x <= 0 && gameElement[3].y <= 0) {
    			gameElement[3].x = 230; $$invalidate('gameElement', gameElement);
    			gameElement[3].y = 190; $$invalidate('gameElement', gameElement);
    		}
    		gameElement[3].r += 4; $$invalidate('gameElement', gameElement);
    	};

    	update = setInterval(draw, 100);

    	//Game complete
    	const gameCompleted = () => {
    		mlData.finishTime = new Date().getTime();		dispatch('complete', mlData);
    	};

    	//collect clicks
    	const captchaClick = () =>{
    		mlData.mouseClicks += 1;	};

    	function click_handler({ i }) {
    		return smash(i);
    	}

    	return {
    		gameElement,
    		smash,
    		moveSpaceship,
    		captchaClick,
    		click_handler
    	};
    }

    class Asteroids extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    /* src\components\JSECaptcha.svelte generated by Svelte v3.5.1 */

    const file$1 = "src\\components\\JSECaptcha.svelte";

    function add_css() {
    	var style = element("style");
    	style.id = 'svelte-1ifa9c2-style';
    	style.textContent = "dl.svelte-1ifa9c2{font-family:arial;box-shadow:0px 0px 0px 2px rgba(0, 0, 0, 0.06);border-radius:4px;margin:20px 0px 20px;min-width:200px;max-width:314px}dt.svelte-1ifa9c2{margin-top:-6px;background:#fff;margin-left:10px;padding:0px 10px;float:left;clear:both;font-weight:bold;text-transform:uppercase;font-size:10px;letter-spacing:1px;color:#666}dd.svelte-1ifa9c2{margin:0px;clear:both;padding:10px}#JSE-DEBUG.svelte-1ifa9c2{display:flex}#JSE-DEBUG.svelte-1ifa9c2>div.svelte-1ifa9c2{flex:1;font-weight:bold;text-transform:uppercase;font-size:11px;letter-spacing:1px;color:#666}#JSE-Captcha.flat.svelte-1ifa9c2{background:none;padding:0px}#JSE-Captcha.flat.svelte-1ifa9c2 details.svelte-1ifa9c2{box-shadow:0px 0px 0px 4px rgba(0, 0, 0, 0.06)}#JSE-Captcha.S.svelte-1ifa9c2{border-radius:6px;font-size:11px}#JSE-Captcha.S.svelte-1ifa9c2 #JSE-input.svelte-1ifa9c2{height:20px;min-width:20px;font-size:15px;border:solid 1px #D3D8DD;padding:1px;margin:6px}#JSE-Captcha.S.svelte-1ifa9c2 #JSE-brand.svelte-1ifa9c2{width:30px;height:38px;border-left:solid 2px #F9F9F9}#JSE-Captcha.S.svelte-1ifa9c2 #JSE-brand svg.svelte-1ifa9c2{width:24px}#JSE-Captcha.S.flat.svelte-1ifa9c2 details.svelte-1ifa9c2{box-shadow:0px 0px 0px 2px rgba(0, 0, 0, 0.06)}#JSE-Captcha.S.success.svelte-1ifa9c2 #JSE-input.svelte-1ifa9c2{min-width:52px}#JSE-Captcha.M.svelte-1ifa9c2{border-radius:6px;font-size:16px}#JSE-Captcha.M.svelte-1ifa9c2 #JSE-input.svelte-1ifa9c2{height:30px;min-width:30px;font-size:20px;border:solid 2px #D3D8DD;margin:8px}#JSE-Captcha.M.svelte-1ifa9c2 #JSE-brand.svelte-1ifa9c2{width:38px;border-left:solid 2px #F9F9F9;height:50px}#JSE-Captcha.M.svelte-1ifa9c2 #JSE-brand svg.svelte-1ifa9c2{width:34px}#JSE-Captcha.M.flat.svelte-1ifa9c2 details.svelte-1ifa9c2{box-shadow:0px 0px 0px 2px rgba(0, 0, 0, 0.06)}#JSE-Captcha.M.success.svelte-1ifa9c2 #JSE-input.svelte-1ifa9c2{min-width:70px}#JSE-Captcha.L.svelte-1ifa9c2{}#JSE-Captcha.success.svelte-1ifa9c2 #JSE-input.svelte-1ifa9c2{min-width:92px}#JSE-Captcha.svelte-1ifa9c2 #JSE-brand.svelte-1ifa9c2{height:68px\n}#captchaCheck.svelte-1ifa9c2{display:none}#JSE-Captcha.svelte-1ifa9c2{display:none;background:#F2F8FF;border-radius:6px;clear:both;padding:13px;min-width:200px;max-width:314px;color:#707070;font-size:20px;font-family:'Montserrat', sans-serif}#JSE-Captcha.svelte-1ifa9c2 .svelte-1ifa9c2{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}#JSE-Captcha.svelte-1ifa9c2 details.svelte-1ifa9c2{overflow:hidden;margin:0px;background:#fff;border-radius:4px;box-shadow:0px 3px 6px 0px rgba(0, 0, 0, 0.12)}#JSE-Captcha.svelte-1ifa9c2 details summary.svelte-1ifa9c2{display:flex;outline:none}#JSE-Captcha.svelte-1ifa9c2 details #JSE-CaptchaDisplay.svelte-1ifa9c2{opacity:0;margin:0px;padding:0px;height:0px;transition:opacity 0.2s, height 0.4s;background:#fff}#JSE-Captcha.svelte-1ifa9c2 details.captchaPanel[open] #JSE-CaptchaDisplay.svelte-1ifa9c2{-webkit-animation-name:svelte-1ifa9c2-slideDown;animation-name:svelte-1ifa9c2-slideDown;-webkit-animation-duration:0.3s;animation-duration:0.3s;-webkit-animation-fill-mode:forwards;animation-fill-mode:forwards;-webkit-animation-delay:0.3s;animation-delay:0.3s}#JSE-Captcha.svelte-1ifa9c2 #JSE-input.svelte-1ifa9c2{border:solid 4px #D3D8DD;border-radius:4px;margin:10px;min-width:40px;height:40px;cursor:pointer;font-size:28px;text-align:center;position:relative;overflow:hidden}#JSE-Captcha.svelte-1ifa9c2 details>summary.svelte-1ifa9c2::-webkit-details-marker{display:none}#JSE-Captcha.svelte-1ifa9c2 details #JSE-input.svelte-1ifa9c2:hover:before{content:'🤖';opacity:1}#JSE-Captcha.success.svelte-1ifa9c2 details #JSE-input.svelte-1ifa9c2:before{content:'😉';opacity:1}#JSE-Captcha.failed.svelte-1ifa9c2 details #JSE-input.svelte-1ifa9c2:before{content:'🤖';opacity:1}#JSE-Captcha.thinking.svelte-1ifa9c2 details #JSE-input.svelte-1ifa9c2:before{content:'🤡';opacity:1}#JSE-Captcha.success.svelte-1ifa9c2 details #JSE-input.svelte-1ifa9c2:after{content:'✔';opacity:1;color:#26AE60;padding:0px 4px 0px 5px;border-left:solid 2px #D3D8DD}#JSE-Captcha.failed.svelte-1ifa9c2 details #JSE-input.svelte-1ifa9c2:after{content:'⛔';opacity:1;padding:0px;border-left:solid 2px #D3D8DD}#JSE-Captcha.success.svelte-1ifa9c2 details.captchaPanel[open] #JSE-input.svelte-1ifa9c2:after{content:'';opacity:0;padding:0px;border:0px}#JSE-Captcha.svelte-1ifa9c2 details #JSE-input.svelte-1ifa9c2:before,#JSE-Captcha.svelte-1ifa9c2 details.captchaPanel[open] #JSE-input.svelte-1ifa9c2:before{opacity:0;content:'🤖';transition:opacity 0.2s;position:absolute;top:0px;left:0px;bottom:0px;right:0px;background:#fff}#JSE-Captcha.success.svelte-1ifa9c2 details.captchaPanel #JSE-input.svelte-1ifa9c2:before{right:50%}#JSE-Captcha.success.svelte-1ifa9c2 details.captchaPanel[open] #JSE-input.svelte-1ifa9c2:after{display:none}#JSE-Captcha.success.svelte-1ifa9c2 details.captchaPanel #JSE-input.svelte-1ifa9c2:after{left:50%;position:absolute;top:0px;bottom:0px;right:0px;background:#fff}#JSE-Captcha.success.svelte-1ifa9c2 #JSE-input.svelte-1ifa9c2{min-width:92px}#JSE-Captcha.success.svelte-1ifa9c2 details.captchaPanel[open] #JSE-input.svelte-1ifa9c2{min-width:20px}#JSE-Captcha.svelte-1ifa9c2 details.captchaPanel[open] #JSE-input.svelte-1ifa9c2:before{opacity:1}#JSE-Captcha.svelte-1ifa9c2 #JSE-msg.svelte-1ifa9c2{align-self:center;padding:0px 0px 0px 4px;flex:1}#JSE-Captcha.svelte-1ifa9c2 #JSE-msg p.svelte-1ifa9c2{vertical-align:bottom;display:inline-block;margin:0px;line-height:1.2}#JSE-Captcha.svelte-1ifa9c2 #JSE-brand.svelte-1ifa9c2{border-left:solid 3px #F9F9F9;align-self:center;width:60px;height:68px;padding:0px 4px;text-align:center;display:flex;justify-content:center;align-content:center}#JSE-Captcha.svelte-1ifa9c2 #JSE-brand svg.svelte-1ifa9c2{fill:#51BFEC;width:48px}#JSE-Captcha.svelte-1ifa9c2 #JSE-CaptchaDisplay #JSE-captcha-game-container.svelte-1ifa9c2{background:#F2F8FF;border-radius:6px;height:100%;position:relative;overflow:hidden}#JSE-Captcha.svelte-1ifa9c2 #JSE-CaptchaDisplay #JSE-captcha-game.svelte-1ifa9c2{height:100%}@-webkit-keyframes svelte-1ifa9c2-slideDown{from{opacity:0;height:0;padding:8px;border-top:solid 4px #F9F9F9}to{opacity:1;height:190px;padding:8px;border-top:solid 4px #F9F9F9}}@keyframes svelte-1ifa9c2-slideDown{from{opacity:0;height:0;padding:8px;border-top:solid 4px #F9F9F9}to{opacity:1;height:190px;padding:8px;border-top:solid 4px #F9F9F9}}#JSE-Captcha.svelte-1ifa9c2 details #JSE-msg>p.svelte-1ifa9c2:after{content:'Im human'}#JSE-Captcha.svelte-1ifa9c2 details.captchaPanel[open] #JSE-msg>p.svelte-1ifa9c2:after,#JSE-Captcha.success.svelte-1ifa9c2 details.captchaPanel[open] #JSE-msg>p.svelte-1ifa9c2:after{content:'Im not a robot'}#JSE-Captcha.success.svelte-1ifa9c2 details #JSE-msg>p.svelte-1ifa9c2:after{content:'Verified human'}#JSE-Captcha.failed.svelte-1ifa9c2 details #JSE-msg>p.svelte-1ifa9c2:after{content:'Failed verification'}#JSE-Captcha.thinking.svelte-1ifa9c2 details #JSE-msg>p.svelte-1ifa9c2:after{content:'Verifying ...'}#JSE-input.svelte-1ifa9c2 input[type=\"checkbox\"].svelte-1ifa9c2{}#JSE-Captcha.active.svelte-1ifa9c2{display:block}.gfx.svelte-1ifa9c2{position:absolute;opacity:1;transition:opacity 0.6s}.gfx.active.svelte-1ifa9c2{opacity:0}.game.svelte-1ifa9c2{height:100%;background-size:350px;background-repeat:no-repeat;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='254.732' height='142.65' viewBox='0 0 254.732 142.65'%3E%3Crect width='254.732' height='142.65' fill='%2326136e'/%3E%3Cg transform='translate(13.799 8.326)'%3E%3Cg transform='translate(66.725 16.157)'%3E%3Cpath d='M600.042,261.883A46.842,46.842,0,1,0,553.2,215.042a46.93,46.93,0,0,0,46.842,46.842Z' transform='translate(-553.2 -168.2)' fill='%23331178' fill-rule='evenodd'/%3E%3Cpath d='M637.039,292.578A40.539,40.539,0,1,0,596.5,252.039a40.616,40.616,0,0,0,40.539,40.539Z' transform='translate(-590.197 -205.197)' fill='%233a1580' fill-rule='evenodd'/%3E%3Cpath d='M694.542,340.285A30.743,30.743,0,1,0,663.8,309.543a30.807,30.807,0,0,0,30.742,30.743Z' transform='translate(-647.701 -262.701)' fill='%2344158f' fill-rule='evenodd'/%3E%3Cpath d='M751.534,387.567A21.034,21.034,0,1,0,730.5,366.534a21.072,21.072,0,0,0,21.034,21.034Z' transform='translate(-704.692 -319.692)' fill='%23521b96' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(0)'%3E%3Cpath d='M112.413,92.411A17.606,17.606,0,1,0,94.8,74.8a17.643,17.643,0,0,0,17.613,17.613Z' transform='translate(-94.8 -57.2)' fill='%23341270' fill-rule='evenodd'/%3E%3Cpath d='M126.34,103.966a15.233,15.233,0,1,0-15.24-15.24,15.26,15.26,0,0,0,15.24,15.24Z' transform='translate(-108.727 -71.127)' fill='%233d1273' fill-rule='evenodd'/%3E%3Cpath d='M147.958,121.9A11.55,11.55,0,1,0,136.4,110.343,11.573,11.573,0,0,0,147.958,121.9Z' transform='translate(-130.345 -92.745)' fill='%23491279' fill-rule='evenodd'/%3E%3Cpath d='M169.4,139.608a7.9,7.9,0,1,0-7.9-7.9,7.921,7.921,0,0,0,7.9,7.9Z' transform='translate(-151.791 -114.106)' fill='%2355147f' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(191.777 14.905)'%3E%3Cpath d='M1418.952,172.9a6.652,6.652,0,1,0-6.652-6.652,6.66,6.66,0,0,0,6.652,6.652Z' transform='translate(-1412.3 -159.6)' fill='%23341270' fill-rule='evenodd'/%3E%3Cpath d='M1424.249,177.314a5.757,5.757,0,1,0-5.75-5.75,5.774,5.774,0,0,0,5.75,5.75Z' transform='translate(-1417.597 -164.898)' fill='%233d1273' fill-rule='evenodd'/%3E%3Cpath d='M1432.367,184.034a4.367,4.367,0,1,0-4.367-4.367,4.38,4.38,0,0,0,4.367,4.367Z' transform='translate(-1425.715 -173.015)' fill='%23491279' fill-rule='evenodd'/%3E%3Cpath d='M1440.484,190.768a2.984,2.984,0,1,0-2.984-2.984,2.988,2.988,0,0,0,2.984,2.984Z' transform='translate(-1433.832 -181.132)' fill='%2355147f' fill-rule='evenodd'/%3E%3C/g%3E%3C/g%3E%3Cg transform='translate(198.997 65.488)'%3E%3Cpath d='M1377.433,470.38a10.24,10.24,0,1,0-10.233-10.247,10.263,10.263,0,0,0,10.233,10.247Z' transform='translate(-1367.185 -449.9)' fill='%23f66' fill-rule='evenodd'/%3E%3Cpath d='M1391.076,449.9a10.24,10.24,0,1,1,0,20.48c-1.033-.277-3.2-.451-2.853-1.412.175-.48,1.543.189,2.9.306,1.805.131,3.7-.233,3.916-.815.306-.873-1.863-.291-4.367-.422-2.969-.16-6.376-1.033-6.288-2.416.073-1.048,3.057.306,6,.568,3,.277,5.953-.553,6.114-2.3.16-1.776-2.737-1.325-6.084-1.4-3.13-.073-7.1-1.135-7.234-3.028-.146-2.038,3.057-1.194,6.084-1.252,3.057-.058,5.953-1.034,5.415-3.071-.291-1.106-2.111-.408-4.367-.306s-4.993-.378-5.167-1.31c-.32-1.747,3.784-3.406,5.939-3.625Z' transform='translate(-1380.829 -449.9)' fill='%23c43f57' fill-rule='evenodd'/%3E%3Cpath d='M1377.348,449.9c.335,0,.67.015.99.044h-.233a10.25,10.25,0,0,0-.99,20.451,10.249,10.249,0,0,1,.233-20.5Z' transform='translate(-1367.1 -449.9)' fill='%23df99ff' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(72.271 34.338)'%3E%3Cpath d='M498.727,240.354a2.227,2.227,0,1,0-2.227-2.227,2.236,2.236,0,0,0,2.227,2.227Z' transform='translate(-496.5 -235.9)' fill='%237c1370' fill-rule='evenodd'/%3E%3Cpath d='M505.589,238.315a2.228,2.228,0,0,1-1.223,4.09,1.582,1.582,0,0,1-.262-.015,2.228,2.228,0,0,1,1.223-4.09c.087,0,.175.015.262.015Z' transform='translate(-502.139 -237.951)' fill='%23be2385' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(112.024 55.983)'%3E%3Cpath d='M784.942,415.284A15.342,15.342,0,1,0,769.6,399.942a15.372,15.372,0,0,0,15.342,15.342Z' transform='translate(-769.6 -384.6)' fill='%236838a4' fill-rule='evenodd'/%3E%3Cpath d='M804.167,431.234A12.067,12.067,0,1,0,792.1,419.167a12.092,12.092,0,0,0,12.067,12.067Z' transform='translate(-788.825 -403.825)' fill='%23794dae' fill-rule='evenodd'/%3E%3Cpath d='M819.718,444.136a9.418,9.418,0,1,0-9.418-9.418,9.433,9.433,0,0,0,9.418,9.418Z' transform='translate(-804.376 -419.376)' fill='%239e7ec5' fill-rule='evenodd'/%3E%3Cpath d='M827.151,450.3A8.151,8.151,0,1,0,819,442.151a8.166,8.166,0,0,0,8.151,8.151Z' transform='translate(-811.809 -426.809)' fill='%23fff' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(44.134 114.12)'%3E%3Cpath d='M303.984,888.147a.755.755,0,0,1,.393.1c.116.073,13.974-7.773,14.047-7.656s-13.625,8.21-13.625,8.37a.8.8,0,1,1-1.6,0,.79.79,0,0,1,.786-.815Z' transform='translate(-303.197 -866.531)' fill='%23ffc' fill-rule='evenodd'/%3E%3Cpath d='M304.926,934.952a.626.626,0,1,0,0-1.252.621.621,0,0,0-.626.626.631.631,0,0,0,.626.626Z' transform='translate(-304.139 -911.909)' fill='%23ff6' fill-rule='evenodd'/%3E%3Cpath d='M305.822,936.344a.422.422,0,1,0-.422-.422.422.422,0,0,0,.422.422Z' transform='translate(-305.079 -913.447)' fill='%23fc0' fill-rule='evenodd'/%3E%3Cpath d='M425.943,796.372c.029-.015,21.368-12.416,21.4-12.373s-21.208,12.591-21.252,12.62c-.291.175-.408-.087-.146-.247Z' transform='translate(-407.951 -783.999)' fill='%23ffc' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(7.773 4.09)'%3E%3Cpath d='M641.864,111.213a.36.36,0,0,0,.364-.364.348.348,0,0,0-.364-.349.357.357,0,1,0,0,.713Z' transform='translate(-555.896 -98.506)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M480.564,81.628a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-418.075 -73.214)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M416.364,279.228a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-363.22 -242.051)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M554.064,530.028a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-480.876 -456.345)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M421.264,652.213a.357.357,0,0,0,.364-.349.37.37,0,0,0-.364-.364.357.357,0,1,0,0,.713Z' transform='translate(-367.406 -560.757)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M473.164,662.028a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-411.752 -569.131)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M687.964,847.128a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-595.285 -727.287)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M621.364,891.713a.36.36,0,0,0,.364-.364.348.348,0,0,0-.364-.349.357.357,0,1,0,0,.713Z' transform='translate(-538.38 -765.395)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M179.264,689.128a.364.364,0,1,0-.364-.364.38.38,0,0,0,.364.364Z' transform='translate(-160.632 -592.286)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M799.164,642.228a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-690.299 -552.213)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1028.764,745.928a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-886.478 -640.818)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1243.664,543.428a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1070.097 -467.794)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1401.664,348.328a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-1205.098 -301.093)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1362.164,254.528a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1171.348 -220.947)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1473.944,203.613a.357.357,0,1,0,0-.713.348.348,0,0,0-.349.364.336.336,0,0,0,.349.349Z' transform='translate(-1266.869 -177.456)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1552.364,197.728a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1333.862 -172.415)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1453.364,157.728a.364.364,0,1,0-.364-.364.352.352,0,0,0,.364.364Z' transform='translate(-1249.273 -138.237)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1305.364,39.728a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-1122.816 -37.413)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1673.364,39.728a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-1437.249 -37.413)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1663.464,229.828a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1428.79 -199.842)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1539.964,471.828a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1323.267 -406.616)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1651.064,578.028a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-1418.195 -497.358)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1591.864,753.413a.36.36,0,0,0,.364-.364.348.348,0,0,0-.364-.349.357.357,0,1,0,0,.713Z' transform='translate(-1367.612 -647.226)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1273.264,738.528a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1095.388 -634.495)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1142.364,859.528a.364.364,0,1,0-.364-.364.38.38,0,0,0,.364.364Z' transform='translate(-983.542 -737.882)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1026.364,123.628a.348.348,0,0,0,.349-.364.357.357,0,1,0-.349.364Z' transform='translate(-884.427 -109.101)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M132.364,52.028a.348.348,0,0,0,.349-.364.357.357,0,1,0-.713,0,.37.37,0,0,0,.364.364Z' transform='translate(-120.559 -47.923)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M145.2,62.494a.59.59,0,0,0,.6-.6.6.6,0,0,0-.6-.6.609.609,0,0,0-.6.6.6.6,0,0,0,.6.6Z' transform='translate(-131.325 -56.467)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M279.6,29.294a.6.6,0,0,0,.6-.6.609.609,0,0,0-.6-.6.6.6,0,0,0-.6.6.59.59,0,0,0,.6.6Z' transform='translate(-246.161 -28.1)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M329,76.194a.609.609,0,0,0,.6-.6.6.6,0,0,0-.6-.6.6.6,0,0,0,0,1.194Z' transform='translate(-288.371 -68.173)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M641.3,52.794a.6.6,0,0,0,.6-.6.59.59,0,0,0-.6-.6.6.6,0,0,0,0,1.194Z' transform='translate(-555.212 -48.179)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M266.4,375.394a.6.6,0,0,0,.6-.6.609.609,0,0,0-.6-.6.6.6,0,0,0-.6.6.59.59,0,0,0,.6.6Z' transform='translate(-234.883 -323.821)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M572.6,718.694a.6.6,0,0,0,.6-.6.609.609,0,0,0-.6-.6.6.6,0,1,0,0,1.194Z' transform='translate(-496.512 -617.15)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M54,876.694a.6.6,0,1,0,0-1.194.609.609,0,0,0-.6.6.6.6,0,0,0,.6.6Z' transform='translate(-53.4 -752.152)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1002.3,908.794a.59.59,0,0,0,.6-.6.6.6,0,0,0-.6-.6.609.609,0,0,0-.6.6.59.59,0,0,0,.6.6Z' transform='translate(-863.664 -779.579)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1192.9,474.194a.6.6,0,0,0,.6-.6.59.59,0,0,0-.6-.6.6.6,0,1,0,0,1.194Z' transform='translate(-1026.52 -408.24)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1588.1,673.494a.59.59,0,0,0,.6-.6.6.6,0,0,0-.6-.6.609.609,0,0,0-.6.6.6.6,0,0,0,.6.6Z' transform='translate(-1364.195 -578.53)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M935.4,220.094a.6.6,0,0,0,.6-.6.59.59,0,0,0-.6-.6.6.6,0,0,0-.6.6.59.59,0,0,0,.6.6Z' transform='translate(-806.502 -191.127)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1582.6,63.494a.609.609,0,0,0,.6-.6.6.6,0,1,0-1.194,0,.609.609,0,0,0,.6.6Z' transform='translate(-1359.495 -57.322)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M679.247,446.995a.247.247,0,1,0-.247-.247.245.245,0,0,0,.247.247Z' transform='translate(-587.937 -385.597)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M677.547,160.995a.255.255,0,0,0,.247-.247.245.245,0,0,0-.247-.247.247.247,0,1,0,0,.495Z' transform='translate(-586.484 -141.228)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M965.247,65.595a.255.255,0,0,0,.247-.247.245.245,0,0,0-.247-.247.237.237,0,0,0-.247.247.245.245,0,0,0,.247.247Z' transform='translate(-832.306 -59.714)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1315.948,297.695a.247.247,0,1,0-.247-.247.237.237,0,0,0,.247.247Z' transform='translate(-1131.958 -258.029)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1565.348,297.695a.255.255,0,0,0,.247-.247.245.245,0,0,0-.247-.247.255.255,0,0,0-.248.247.237.237,0,0,0,.248.247Z' transform='translate(-1345.055 -258.029)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1627.048,517.495a.247.247,0,0,0,0-.495.247.247,0,1,0,0,.495Z' transform='translate(-1397.774 -445.835)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1041.748,537.295a.247.247,0,0,0,0-.495.247.247,0,1,0,0,.495Z' transform='translate(-897.671 -462.753)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1138.147,729.895a.247.247,0,1,0-.247-.247.245.245,0,0,0,.247.247Z' transform='translate(-980.039 -627.318)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M426.947,406.395a.247.247,0,1,0,0-.495.255.255,0,0,0-.247.247.245.245,0,0,0,.247.247Z' transform='translate(-372.362 -350.907)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M256.447,213.195a.247.247,0,1,0-.247-.247.245.245,0,0,0,.247.247Z' transform='translate(-226.68 -185.829)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M251.547,337.295a.247.247,0,1,0-.247-.247.255.255,0,0,0,.247.247Z' transform='translate(-222.493 -291.865)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M157.747,510.095a.247.247,0,0,0,0-.495.245.245,0,0,0-.247.247.237.237,0,0,0,.247.247Z' transform='translate(-142.347 -439.512)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M214.347,175.195a.245.245,0,0,0,.247-.247.247.247,0,0,0-.495,0,.245.245,0,0,0,.247.247Z' transform='translate(-190.708 -153.361)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M370.14,322.495a.255.255,0,0,0,.247-.247.245.245,0,0,0-.247-.247.255.255,0,0,0-.247.247.237.237,0,0,0,.247.247Z' transform='translate(-323.823 -279.22)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M192.647,872.695a.247.247,0,1,0-.247-.247.245.245,0,0,0,.247.247Z' transform='translate(-172.167 -749.332)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M542.948,937.295a.255.255,0,0,0,.247-.247.245.245,0,0,0-.247-.247.255.255,0,0,0-.247.247.245.245,0,0,0,.247.247Z' transform='translate(-471.477 -804.529)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1691.248,881.995a.247.247,0,1,0-.248-.247.255.255,0,0,0,.248.247Z' transform='translate(-1452.629 -757.278)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1331.448,644.195a.247.247,0,0,0,0-.495.247.247,0,0,0,0,.495Z' transform='translate(-1145.202 -554.093)' fill='%23fff' fill-rule='evenodd'/%3E%3C/g%3E%3C/svg%3E\");cursor:url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"40\" height=\"40\" viewBox=\"0 0 40 40\"><g transform=\"translate(-844 -500)\"><g transform=\"translate(844 -520.36)\"><path d=\"M194.787,1212.29a2.858,2.858,0,1,0,2.858,2.858,2.869,2.869,0,0,0-2.858-2.858Z\" transform=\"translate(-174.792 -174.793)\" fill=\"%23868686\"/><path d=\"M209.416,1228.35a1.429,1.429,0,1,1-1.424,1.424,1.419,1.419,0,0,1,1.424-1.424Z\" transform=\"translate(-189.421 -189.419)\" fill=\"%23ff655b\"/><g transform=\"translate(0 1020.36)\"><path d=\"M216.024,1020.36v12.855h1.424V1020.36Z\" transform=\"translate(-196.736 -1020.36)\" fill=\"%23868686\"/><path d=\"M216.024,1324.26v12.866h1.424V1324.26Z\" transform=\"translate(-196.736 -1297.126)\" fill=\"%23868686\"/><path d=\"M304.016,1236.27v1.434h12.855v-1.434Z\" transform=\"translate(-276.871 -1216.992)\" fill=\"%23868686\"/><path d=\"M0,1236.27v1.434H12.855v-1.434Z\" transform=\"translate(0 -1216.992)\" fill=\"%23868686\"/></g><g transform=\"translate(8.861 1029.216)\"><path d=\"M244.5,1119.548a.714.714,0,0,0-.12,1.409,10,10,0,0,1,7.4,7.391.715.715,0,0,0,1.391-.33v0a11.431,11.431,0,0,0-8.454-8.443.718.718,0,0,0-.212-.023Z\" transform=\"translate(-230.918 -1119.547)\" fill=\"%23868686\"/><path d=\"M107.971,1119.589a.721.721,0,0,0-.19.023,11.428,11.428,0,0,0-8.44,8.427.714.714,0,0,0,1.379.369c0-.01.005-.021.008-.031a10,10,0,0,1,7.386-7.377.714.714,0,0,0-.142-1.409Z\" transform=\"translate(-99.31 -1119.586)\" fill=\"%23868686\"/><path d=\"M252.407,1264.338a.714.714,0,0,0-.712.555,10,10,0,0,1-7.386,7.38.714.714,0,0,0,.282,1.4l.053-.013a11.43,11.43,0,0,0,8.44-8.429.713.713,0,0,0-.678-.893Z\" transform=\"translate(-230.835 -1251.41)\" fill=\"%23868686\"/><path d=\"M99.924,1264.077a.714.714,0,0,0-.656.89,11.431,11.431,0,0,0,8.44,8.454.715.715,0,0,0,.335-1.39h0a9.995,9.995,0,0,1-7.386-7.4.714.714,0,0,0-.734-.558h0Z\" transform=\"translate(-99.246 -1251.172)\" fill=\"%23868686\"/></g><g transform=\"translate(2 1022.36)\" fill=\"none\" stroke=\"%23707070\" stroke-width=\"2\"><circle cx=\"18\" cy=\"18\" r=\"18\" stroke=\"none\"/><circle cx=\"18\" cy=\"18\" r=\"17\" fill=\"none\"/></g></g></g></svg>') 16 16, auto}.asteroid.svelte-1ifa9c2{width:40px;height:40px;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg transform='translate(0 0)'%3E%3Cpath d='M230.994,11.742,221.867,22.4v2A14.671,14.671,0,0,0,236.3,12.366,25.741,25.741,0,0,0,230.994,11.742Z' transform='translate(-195.867 -10.366)' fill='%234a8dc6'/%3E%3Cpath d='M146.179,11.984l.035-.268a31.976,31.976,0,0,0-20.381,7.4,14.635,14.635,0,0,0,11.254,5.262v-2C141.56,22.375,145.383,18,146.179,11.984Z' transform='translate(-111.088 -10.34)' fill='%2377aad4'/%3E%3Cpath d='M241.059,24.221A10.663,10.663,0,0,0,233.9,7.441a22.167,22.167,0,0,0-8.472-4.913c.011-.057.022-.114.033-.171a2,2,0,0,0-3.936-.713,12.621,12.621,0,0,1-1.353,3.82l-12.81,51.886a10.663,10.663,0,0,0,17.178-4.719,35.188,35.188,0,0,0,4.576-3.339,4.666,4.666,0,0,0,5.2-5.506A31.8,31.8,0,0,0,241.059,24.221Z' transform='translate(-183.064 0)' fill='%23a5c6e3'/%3E%3Cpath d='M53.914,67.8c.528-6.259-1.372-11.9-5.351-15.875A18.917,18.917,0,0,0,37.11,46.619a12.672,12.672,0,0,1-20.83,2.026,2,2,0,1,0-3.068,2.567l.016.019q-.657.6-1.293,1.229a35.744,35.744,0,0,0-4.177,5.017A12.672,12.672,0,0,0,2.013,76.009,23.1,23.1,0,0,0,8.608,91.916,23.064,23.064,0,0,0,24.3,98.505a51.738,51.738,0,0,0,20.936-12.78A29.072,29.072,0,0,0,53.914,67.8Z' transform='translate(0 -41.156)' fill='%23d2e3f1'/%3E%3Cpath d='M267.378,364.089v13.333a6.667,6.667,0,0,0,0-13.333Z' transform='translate(-236.045 -321.423)' fill='%234a8dc6'/%3E%3Cpath d='M219.821,370.756c0-3.682-1.194-6.667-2.667-6.667a6.667,6.667,0,0,0,0,13.333C218.628,377.422,219.821,374.438,219.821,370.756Z' transform='translate(-185.821 -321.423)' fill='%2377aad4'/%3E%3Cpath d='M420.978,96.711v13.333a6.667,6.667,0,0,0,0-13.333Z' transform='translate(-371.645 -85.378)' fill='%234a8dc6'/%3E%3Cpath d='M373.421,103.378c0-3.682-1.194-6.667-2.667-6.667a6.667,6.667,0,1,0,0,13.333C372.228,110.044,373.421,107.06,373.421,103.378Z' transform='translate(-321.421 -85.378)' fill='%2377aad4'/%3E%3Cg transform='translate(15.667 25)'%3E%3Ccircle cx='1' cy='1' r='1' transform='translate(13.333 4)' fill='%23a5c6e3'/%3E%3Ccircle cx='1' cy='1' r='1' transform='translate(17.333)' fill='%23a5c6e3'/%3E%3Ccircle cx='1' cy='1' r='1' transform='translate(28 12.667)' fill='%23a5c6e3'/%3E%3Ccircle cx='1' cy='1' r='1' transform='translate(0 24.667)' fill='%23a5c6e3'/%3E%3C/g%3E%3Cpath d='M108.089,164.978v17.333a8.667,8.667,0,1,0,0-17.333Z' transform='translate(-95.422 -145.645)' fill='%234a8dc6'/%3E%3Cpath d='M47.466,173.644c0-4.786-2.089-8.667-4.667-8.667a8.667,8.667,0,1,0,0,17.333C45.377,182.31,47.466,178.43,47.466,173.644Z' transform='translate(-30.133 -145.644)' fill='%2377aad4'/%3E%3C/g%3E%3C/svg%3E\");background-size:contain;background-repeat:no-repeat}.spaceship.svelte-1ifa9c2{width:36px;height:46px;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='26.342' height='36' viewBox='0 0 26.342 36'%3E%3Cg transform='translate(-123.583 0)'%3E%3Cpath d='M136.755,150.063l-12.512,10.01a1.756,1.756,0,0,0-.659,1.371v4.424l13.171-2.634,13.171,2.634v-4.424a1.756,1.756,0,0,0-.659-1.371Z' transform='translate(-0.001 -135.137)' fill='%23ff6464'/%3E%3Cpath d='M220.616,313.138l-1.044-4.177h-6.64l-1.044,4.177a.878.878,0,0,0,.852,1.091h7.025a.878.878,0,0,0,.852-1.091Z' transform='translate(-79.498 -278.23)' fill='%23959cb3'/%3E%3Cpath d='M214.523,313.138l1.044-4.177h-2.634l-1.044,4.177a.878.878,0,0,0,.852,1.091h2.634a.878.878,0,0,1-.852-1.091Z' transform='translate(-79.498 -278.23)' fill='%23707487'/%3E%3Cpath d='M207.569.429,203.48,7.736a3.513,3.513,0,0,0-.447,1.715V30.732a1.756,1.756,0,0,0,1.756,1.756h7.025a1.756,1.756,0,0,0,1.756-1.756V9.45a3.511,3.511,0,0,0-.447-1.715L209.034.429A.839.839,0,0,0,207.569.429Z' transform='translate(-71.547 0)' fill='%23e4eaf6'/%3E%3Cpath d='M206.545,30.781V9.5a7.658,7.658,0,0,1,.186-1.715l1.7-7.307a1.111,1.111,0,0,1,.157-.371.833.833,0,0,0-1.023.371L203.48,7.785a3.513,3.513,0,0,0-.447,1.715V30.781a1.756,1.756,0,0,0,1.756,1.756h2.488C206.873,32.537,206.545,31.751,206.545,30.781Z' transform='translate(-71.547 -0.049)' fill='%23c7cfe2'/%3E%3Cpath d='M209.035.43a.839.839,0,0,0-1.464,0l-4.089,7.307a3.513,3.513,0,0,0-.447,1.715v4.6h10.537v-4.6a3.511,3.511,0,0,0-.447-1.715Z' transform='translate(-71.548 -0.001)' fill='%23ff6464'/%3E%3Cpath d='M206.546,9.512a7.658,7.658,0,0,1,.186-1.715l1.7-7.307a1.111,1.111,0,0,1,.157-.371.86.86,0,0,0-.553-.012c-.013,0-.026.011-.039.016a.812.812,0,0,0-.193.106c-.019.014-.038.027-.056.043a.821.821,0,0,0-.182.218L203.481,7.8a3.513,3.513,0,0,0-.447,1.715v4.6h3.512Z' transform='translate(-71.548 -0.061)' fill='%23d2555a'/%3E%3Cpath d='M213.571,141.235H203.034v1.756h2.252a3.469,3.469,0,0,0,6.034,0h2.252v-1.756Z' transform='translate(-71.548 -127.187)' fill='%23c7cfe2'/%3E%3Ccircle cx='1.756' cy='1.756' r='1.756' transform='translate(134.999 12.292)' fill='%235b5d6e'/%3E%3Cpath d='M206.546,144.266v-3.032h-3.512v1.756h2.252A3.551,3.551,0,0,0,206.546,144.266Z' transform='translate(-71.548 -127.186)' fill='%23afb9d2'/%3E%3Cpath d='M219.677.429l-3.2,5.716h7.863l-3.2-5.716A.839.839,0,0,0,219.677.429Z' transform='translate(-83.655 0)' fill='%23707487'/%3E%3Cpath d='M219.211,6.206,220.544.489A1.111,1.111,0,0,1,220.7.118a.86.86,0,0,0-.553-.012l-.011,0-.028.011a.812.812,0,0,0-.193.106l-.02.015c-.012.009-.025.018-.037.028a.823.823,0,0,0-.182.218l-3.2,5.716h2.732Z' transform='translate(-83.656 -0.06)' fill='%235b5d6e'/%3E%3Cg transform='translate(123.583 25.463)'%3E%3Cpath d='M123.584,261.264l7.9-1.581V256l-7.9,2.107Z' transform='translate(-123.584 -255.996)' fill='%23d2555a'/%3E%3Cpath d='M316.87,261.264l-7.9-1.581V256l7.9,2.107Z' transform='translate(-290.527 -255.996)' fill='%23d2555a'/%3E%3C/g%3E%3Cg transform='translate(123.583 25.463)'%3E%3Cpath d='M124.462,264.824h0a.878.878,0,0,0-.878.878v7.025a.878.878,0,0,0,.878.878h0a.878.878,0,0,0,.878-.878V265.7A.878.878,0,0,0,124.462,264.824Z' transform='translate(-123.584 -263.946)' fill='%23afb9d2'/%3E%3Cpath d='M159.773,256h0a.878.878,0,0,0-.878.878v4.39a.878.878,0,0,0,.878.878h0a.878.878,0,0,0,.878-.878v-4.39A.878.878,0,0,0,159.773,256Z' transform='translate(-155.383 -255.996)' fill='%23afb9d2'/%3E%3Cpath d='M371.639,264.824h0a.878.878,0,0,1,.878.878v7.025a.878.878,0,0,1-.878.878h0a.878.878,0,0,1-.878-.878V265.7A.878.878,0,0,1,371.639,264.824Z' transform='translate(-346.175 -263.946)' fill='%23afb9d2'/%3E%3Cpath d='M336.328,256h0a.878.878,0,0,1,.878.878v4.39a.878.878,0,0,1-.878.878h0a.878.878,0,0,1-.878-.878v-4.39A.878.878,0,0,1,336.328,256Z' transform='translate(-314.376 -255.996)' fill='%23afb9d2'/%3E%3C/g%3E%3Cg transform='translate(123.583 25.446)'%3E%3Ccircle cx='0.895' cy='0.895' r='0.895' transform='translate(0 0.862)' fill='%23959cb3'/%3E%3Ccircle cx='0.895' cy='0.895' r='0.895' transform='translate(3.496)' fill='%23959cb3'/%3E%3Ccircle cx='0.895' cy='0.895' r='0.895' transform='translate(24.552 0.862)' fill='%23959cb3'/%3E%3Ccircle cx='0.895' cy='0.895' r='0.895' transform='translate(21.057)' fill='%23959cb3'/%3E%3C/g%3E%3Cg transform='translate(135.876 23.707)'%3E%3Cpath d='M248.05,243.608h0a.878.878,0,0,0,.878-.878v-3.512a.878.878,0,0,0-.878-.878h0a.878.878,0,0,0-.878.878v3.512A.878.878,0,0,0,248.05,243.608Z' transform='translate(-247.172 -238.34)' fill='%23c7cfe2'/%3E%3Cpath d='M274.534,243.608h0a.878.878,0,0,0,.878-.878v-3.512a.878.878,0,0,0-.878-.878h0a.878.878,0,0,0-.878.878v3.512A.878.878,0,0,0,274.534,243.608Z' transform='translate(-271.022 -238.34)' fill='%23c7cfe2'/%3E%3C/g%3E%3Cpath d='M221.567,243.608h0a.878.878,0,0,0,.878-.878v-3.512a.878.878,0,0,0-.878-.878h0a.878.878,0,0,0-.878.878v3.512A.878.878,0,0,0,221.567,243.608Z' transform='translate(-87.447 -214.633)' fill='%23afb9d2'/%3E%3C/g%3E%3C/svg%3E\");background-size:contain;background-repeat:no-repeat}.asteroid.active.svelte-1ifa9c2{width:60px;height:60px;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='65' height='64' viewBox='0 0 65 64'%3E%3Cg transform='translate(-1003 -490)'%3E%3Ccircle cx='23.5' cy='23.5' r='23.5' transform='translate(1009 502)' fill='%23d2e3f1'/%3E%3Ccircle cx='9' cy='9' r='9' transform='translate(1009 502)' fill='%23d2e3f1'/%3E%3Ccircle cx='12' cy='12' r='12' transform='translate(1021 490)' fill='%23d2e3f1'/%3E%3Ccircle cx='12' cy='12' r='12' transform='translate(1033 499)' fill='%23d2e3f1'/%3E%3Ccircle cx='12' cy='12' r='12' transform='translate(1003 520)' fill='%23d2e3f1'/%3E%3Ccircle cx='12' cy='12' r='12' transform='translate(1033 530)' fill='%23d2e3f1'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1048 523)' fill='%23d2e3f1'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1010 523)' fill='%234a8dc6'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1015 514)' fill='%234a8dc6'/%3E%3Ccircle cx='18' cy='18' r='18' transform='translate(1018 504)' fill='%234a8dc6'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1010 523)' fill='%234a8dc6'/%3E%3Ccircle cx='4.5' cy='4.5' r='4.5' transform='translate(1059 513)' fill='%23d2e3f1'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1036 533)' fill='%234a8dc6'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1027 499)' fill='%234a8dc6'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1020 518)' fill='%2377aad4'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1033 507)' fill='%2377aad4'/%3E%3Ccircle cx='5.5' cy='5.5' r='5.5' transform='translate(1037 527)' fill='%2377aad4'/%3E%3Ccircle cx='4' cy='4' r='4' transform='translate(1037 527)' fill='%23fff'/%3E%3Ccircle cx='4' cy='4' r='4' transform='translate(1026 520)' fill='%23fff'/%3E%3Ccircle cx='4' cy='4' r='4' transform='translate(1040 511)' fill='%23fff'/%3E%3C/g%3E%3C/svg%3E\");background-size:contain;background-repeat:no-repeat}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSlNFQ2FwdGNoYS5zdmVsdGUiLCJzb3VyY2VzIjpbIkpTRUNhcHRjaGEuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjwhLS0gRE9NIFRhZyBOYW1lLS0+XG48c3ZlbHRlOm9wdGlvbnMgdGFnPVwianNlLWNhcHRjaGFcIi8+XG48IS0tIHhET00gVGFnIE5hbWUtLT5cblxuPCEtLSBKU0UgQ2FwdGNoYSAtLT5cbjwhLS0gXG5cdE9wdGlvbmFsIGNsYXNzZXNcblx0ZmxhdDogc3dhcHMgdG8gZmxhdCBkZXNpZ25cblx0UzogU21hbGwgY2FwdGNoYVxuXHRNOiBNZWNpdW0gY2FwdGNoYVxuXHRzdWNjZXNzOiBkaXNwbGF5cyBzdWNjZXNzIHBhbmVsIGNhcHRjaGEgbXVzdCBiZSBtaW5pbWlzZWRcbi0tPlxueyNpZiBkZWJ1Z31cbjxkbD5cblx0PGR0Pk9wdGlvbnM8L2R0PlxuXHQ8ZGQ+XG5cdFx0PGRpdiBpZD1cIkpTRS1ERUJVR1wiPlxuXHRcdFx0PGRpdj5cblx0XHRcdFx0PGxhYmVsIGZvcj1cInRoZW1lXCI+XG5cdFx0XHRcdFx0VGhlbWVcblx0XHRcdFx0PC9sYWJlbD5cblx0XHRcdFx0PHNlbGVjdCBpZD1cInRoZW1lXCIgYmluZDp2YWx1ZT1cInt0aGVtZX1cIj5cblx0XHRcdFx0XHR7I2VhY2ggYXZhaWxhYmxlVGhlbWVzIGFzIHNlbGVjdGVkVGhlbWUsIGl9XG5cdFx0XHRcdFx0XHQ8b3B0aW9uPntzZWxlY3RlZFRoZW1lfTwvb3B0aW9uPlxuXHRcdFx0XHRcdHsvZWFjaH1cblx0XHRcdFx0PC9zZWxlY3Q+XG5cdFx0XHQ8L2Rpdj5cblx0XHRcdDxkaXY+XG5cdFx0XHRcdDxsYWJlbCBmb3I9XCJzaXplXCI+XG5cdFx0XHRcdFx0U2l6ZVxuXHRcdFx0XHQ8L2xhYmVsPlxuXHRcdFx0XHQ8c2VsZWN0IGlkPVwic2l6ZVwiIGJpbmQ6dmFsdWU9XCJ7c2l6ZX1cIj5cblx0XHRcdFx0XHR7I2VhY2ggYXZhaWxhYmxlU2l6ZSBhcyBzZWxlY3RlZFNpemUsIGl9XG5cdFx0XHRcdFx0XHQ8b3B0aW9uPntzZWxlY3RlZFNpemV9PC9vcHRpb24+XG5cdFx0XHRcdFx0ey9lYWNofVxuXHRcdFx0XHQ8L3NlbGVjdD5cblx0XHRcdDwvZGl2PlxuXHRcdDwvZGl2PlxuXHQ8L2RkPlxuPC9kbD5cbnsvaWZ9XG5cbjxzZWN0aW9uIGlkPVwiSlNFLUNhcHRjaGFcIiBjbGFzcz1cInt0aGVtZX0ge3NpemV9XCIgY2xhc3M6YWN0aXZlPVwie3Nob3dDYXB0Y2hhfVwiIGNsYXNzOnN1Y2Nlc3M9XCJ7Y29tcGxldGV9XCIgY2xhc3M6dGhpbmtpbmc9XCJ7dGhpbmtpbmd9XCI+XG5cdDxkZXRhaWxzIGNsYXNzPVwiY2FwdGNoYVBhbmVsXCIgYmluZDpvcGVuIG9wZW4+XG5cdFx0PCEtLSBDYXB0Y2hhIFBhbmVsIC0tPlxuXHRcdDxzdW1tYXJ5PlxuXHRcdFx0PCEtLSBJbnB1dCBzZWxlY3QgZmllbGQgLS0+XG5cdFx0XHQ8ZGl2IGlkPVwiSlNFLWlucHV0XCI+XG5cdFx0XHRcdDxpbnB1dCBpZD1cImNhcHRjaGFDaGVja1wiIHR5cGU9XCJjaGVja2JveFwiIGJpbmQ6Y2hlY2tlZD17Y2FwdGNoYUNoZWNrfSAvPlxuXHRcdFx0PC9kaXY+XG5cdFx0XHQ8IS0tIHhJbnB1dCBzZWxlY3QgZmllbGQgLS0+XG5cdFx0XHRcblx0XHRcdDwhLS0gSW5mbyBtc2cgLS0+XG5cdFx0XHQ8ZGl2IGlkPVwiSlNFLW1zZ1wiPlxuXHRcdFx0XHQ8cD48L3A+XG5cdFx0XHQ8L2Rpdj5cblx0XHRcdDwhLS0geEluZm8gbXNnIC0tPlxuXG5cdFx0XHQ8IS0tIEpTRSBsb2dvIC0tPlxuXHRcdFx0PGRpdiBpZD1cIkpTRS1icmFuZFwiPjxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgNzEuNzcxIDY5LjkzMVwiPjxnIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgwKVwiPjxwYXRoIGQ9XCJNNTUuODQsNDA2LjkyOSw1NS44LDQxOC45YTcuMTQ0LDcuMTQ0LDAsMCwwLDMuNTM2LDYuMTI4bDEwLjQ3MSw2YTcuMTUsNy4xNSwwLDAsMCw3LjAwNy4wMTZsMTAuNTQzLTYuMDg3YTcuMDM5LDcuMDM5LDAsMCwwLDMuNTI4LTYuMWwuMDQtMTEuOTcyYTcuMTQzLDcuMTQzLDAsMCwwLTMuNTM2LTYuMTI3bC0xMC40NzEtNmE3LjE1LDcuMTUsMCwwLDAtNy4wMDctLjAxNmwtMTAuNTQzLDYuMDc5QTcuMDQzLDcuMDQzLDAsMCwwLDU1Ljg0LDQwNi45MjlabTE3LjUxOS02Ljk0MywxMS4xODksNi41MjMtLjAwOCwxMi44NDRMNzMuNDA3LDQyNS43OGwtMTEuMTMzLTYuNDE4LS4wNTctMTIuOTQ5WlwiIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgtNTUuOCAtMzYyLjA0NSlcIiBmaWxsPVwiIzUxYmZlY1wiLz48cGF0aCBkPVwiTTUwOS43NCw0MDcuMjI5LDUwOS43LDQxOS4yYTcuMTQ0LDcuMTQ0LDAsMCwwLDMuNTM2LDYuMTI4bDEwLjQ3MSw2YTcuMTUsNy4xNSwwLDAsMCw3LjAwOC4wMTZsMTAuNTQzLTYuMDg3YTcuMDM5LDcuMDM5LDAsMCwwLDMuNTI4LTYuMWwuMDQtMTEuOTcyYTcuMTQ0LDcuMTQ0LDAsMCwwLTMuNTM2LTYuMTI4bC0xMC40NzEtNmE3LjE1LDcuMTUsMCwwLDAtNy4wMDctLjAxNmwtMTAuNTQ0LDYuMDg3QTcuMDYzLDcuMDYzLDAsMCwwLDUwOS43NCw0MDcuMjI5Wm0xNy41MTktNi45MzUsMTEuMTg5LDYuNTIzLS4wMDgsMTIuODQ0LTExLjEzMyw2LjQyNi0xMS4xMjUtNi40MTgtLjA1Ny0xMi45NDlaXCIgdHJhbnNmb3JtPVwidHJhbnNsYXRlKC00NzMuMDU2IC0zNjIuMzIxKVwiIGZpbGw9XCIjNTFiZmVjXCIvPjxwYXRoIGQ9XCJNMjgyLjU0LDEzLjEyOSwyODIuNSwyNS4xYTcuMTQ0LDcuMTQ0LDAsMCwwLDMuNTM2LDYuMTI3bDEwLjQ3MSw2YTcuMTUsNy4xNSwwLDAsMCw3LjAwNy4wMTZsMTAuNTQzLTYuMDg3YTcuMDM5LDcuMDM5LDAsMCwwLDMuNTI4LTYuMWwuMDQtMTEuOTcyYTcuMTQ0LDcuMTQ0LDAsMCwwLTMuNTM2LTYuMTI3bC0xMC40NzEtNmE3LjE1LDcuMTUsMCwwLDAtNy4wMDctLjAxNkwyODYuMDY4LDcuMDM0QTcuMDMsNy4wMywwLDAsMCwyODIuNTQsMTMuMTI5Wm0xNy41MTEtNi45MzUsMTEuMTg5LDYuNTE1LS4wMDgsMTIuODQ0TDMwMC4xLDMxLjk4bC0xMS4xMjUtNi40MTgtLjA1Ni0xMi45NDFaXCIgdHJhbnNmb3JtPVwidHJhbnNsYXRlKC0yNjQuMTk4IC0wLjAzNylcIiBmaWxsPVwiIzUxYmZlY1wiLz48ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoMjcuNDQgNjUuOTczKVwiPjxwYXRoIGQ9XCJNNDExLDgxNy4yNzNhMjYuODUxLDI2Ljg1MSwwLDAsMS0xMy43ODEtLjAwOCwxLjIxNCwxLjIxNCwwLDAsMC0uNjQ2LDIuMzQxLDI5LjUsMjkuNSwwLDAsMCwxNS4wNjQuMDA4LDEuMjM5LDEuMjM5LDAsMCwwLC44NDgtMS40OTQsMS4yMjYsMS4yMjYsMCwwLDAtMS40ODUtLjg0OFpcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTM5NS42ODggLTgxNy4yMjcpXCIgZmlsbD1cIiM1MWJmZWNcIi8+PC9nPjxnIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSg3Ljc0NCAxOS4zOClcIj48ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoMClcIj48cGF0aCBkPVwiTTE1NC4xLDI1NC4xYTI2LjgsMjYuOCwwLDAsMSw2LjktMTEuOTQ4LDEuMjEsMS4yMSwwLDEsMC0xLjcxMi0xLjcxMiwyOS4yNTcsMjkuMjU3LDAsMCwwLTcuNTI0LDEzLjAxNCwxLjIxLDEuMjEsMCwxLDAsMi4zMzMuNjQ2WlwiIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgtMTUxLjcyNyAtMjQwLjA4NylcIiBmaWxsPVwiIzUxYmZlY1wiLz48L2c+PC9nPjxnIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSg1NC4zNTIgMTkuMzY2KVwiPjxnIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgwKVwiPjxwYXRoIGQ9XCJNNzI5LjQsMjQxLjk5YTI2LjcyLDI2LjcyLDAsMCwxLDYuOSwxMS45NDgsMS4yMTQsMS4yMTQsMCwxLDAsMi4zNDEtLjY0NiwyOS4zLDI5LjMsMCwwLDAtNy41MzItMTMuMDIyLDEuMjEzLDEuMjEzLDAsMCwwLTEuNzExLDEuNzJaXCIgdHJhbnNmb3JtPVwidHJhbnNsYXRlKC03MjkuMDUgLTIzOS45MjUpXCIgZmlsbD1cIiM1MWJmZWNcIi8+PC9nPjwvZz48L2c+PC9zdmc+PC9kaXY+XG5cdFx0XHQ8IS0tIHhKU0UgbG9nbyAtLT5cblx0XHQ8L3N1bW1hcnk+XG5cdFx0PCEtLSB4Q2FwdGNoYSBQYW5lbCAtLT5cblxuXHRcdDwhLS0gQ2FwdGNoYSBHYW1lIC0tPlxuXHRcdDxkaXYgaWQ9XCJKU0UtQ2FwdGNoYURpc3BsYXlcIj5cblx0XHRcdDxkaXYgaWQ9XCJKU0UtY2FwdGNoYS1nYW1lLWNvbnRhaW5lclwiIG9uOm1vdXNlbW92ZT1cIntoYW5kbGVNb3ZlbWVudH1cIiBvbjp0b3VjaG1vdmV8cGFzc2l2ZT1cIntoYW5kbGVNb3ZlbWVudH1cIj5cblx0XHRcdHsjaWYgb3Blbn1cdFxuXHRcdFx0XHQ8ZGl2IGlkPVwiSlNFLWNhcHRjaGEtZ2FtZVwiPlxuXHRcdFx0XHRcdDxBc3Rlcm9pZHMgb246Y29tcGxldGU9XCJ7Y2FsbGJhY2tGdW5jdGlvbn1cIiAvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdHsvaWZ9XG5cdFx0XHQ8L2Rpdj5cblx0XHQ8L2Rpdj5cblx0XHQ8IS0tIHhDYXB0Y2hhIEdhbWUgLS0+XG5cdDwvZGV0YWlscz5cbjwvc2VjdGlvbj5cbjwhLS0geEpTRSBDYXB0Y2hhIC0tPlxuXG5cblxuXG48c2NyaXB0PlxuXHQvL2xpYnNcblx0aW1wb3J0IHsgb25Nb3VudCwgY3JlYXRlRXZlbnREaXNwYXRjaGVyIH0gZnJvbSAnc3ZlbHRlJztcblx0aW1wb3J0IEFzdGVyb2lkcyBmcm9tICcuL0FzdGVyb2lkcy5zdmVsdGUnXG5cblx0Ly9Qcm9wc1xuXHRleHBvcnQgbGV0IHNpemUgPSAnTCc7XG5cdGV4cG9ydCBsZXQgZGVidWcgPSBmYWxzZTtcblx0ZXhwb3J0IGxldCB0aGVtZSA9ICdmbGF0Jztcblx0ZXhwb3J0IGxldCBjYXB0Y2hhU2VydmVyID0gJ2h0dHBzOi8vbG9hZC5qc2Vjb2luLmNvbSc7XG5cblx0Ly9FdmVudHNcblx0Y29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKTtcblxuXHQvL0luaXQgY2FwdGNoYVxuXHRsZXQgb3BlbiA9IGZhbHNlO1xuXHRsZXQgc2hvd0NhcHRjaGEgPSBmYWxzZTtcblx0bGV0IGNhcHRjaGFDaGVjayA9IGZhbHNlO1xuXHRsZXQgdGhpbmtpbmcgPSBmYWxzZTtcblx0bGV0IGNvbXBsZXRlID0gZmFsc2U7XG5cblx0Y29uc3QgYXZhaWxhYmxlVGhlbWVzID0gW1xuXHRcdCdkZWZhdWx0Jyxcblx0XHQnZmxhdCcsXG5cdF07XG5cdGNvbnN0IGF2YWlsYWJsZVNpemUgPSBbXG5cdFx0J1MnLFxuXHRcdCdNJyxcblx0XHQnTCcsXG5cdF07XG5cblx0c2V0VGltZW91dCgoKSA9PiB7XG5cdFx0c2hvd0NhcHRjaGEgPSB0cnVlO1xuXHR9LCAxMCk7XG5cblx0JDogaWYgKG9wZW4pIHtcblx0XHRjb21wbGV0ZSA9IGZhbHNlO1xuXHR9XG5cblx0Ly9Nb3VudGVkXG5cdG9uTW91bnQoKCkgPT4ge1xuXHR9KTtcblxuXHQvL1N1Y2Nlc3Ncblx0ZGlzcGF0Y2goJ3N1Y2Nlc3MnLCAnc3VjY2VzcyBldmVudCBzZW50Jyk7XG5cblx0Ly9NZXRob2RzXG5cdC8qKlxuICAgICAqIHJlcXVlc3RVUkxcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVxdWVzdFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXF1ZXN0Lm1ldGhvZCBUaGUgSFRUUCBtZXRob2QgdG8gdXNlIGZvciB0aGUgcmVxdWVzdC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVxdWVzdC51cmwgVGhlIFVSTCBmb3IgdGhlIHJlcXVlc3RcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVxdWVzdC5jb250ZW50IFRoZSBib2R5IGNvbnRlbnQgZm9yIHRoZSByZXF1ZXN0LiBNYXkgYmUgYSBzdHJpbmcgb3IgYW4gQXJyYXlCdWZmZXIgKGZvciBiaW5hcnkgZGF0YSkuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHJlcXVlc3QuaGVhZGVycyBBbiBvYmplY3QgZGVzY3JpYmluZyBoZWFkZXJzIHRvIGFwcGx5IHRvIHRoZSByZXF1ZXN0IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH1cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVxdWVzdC5yZXNwb25zZVR5cGUgVGhlIFhNTEh0dHBSZXF1ZXN0UmVzcG9uc2VUeXBlIHRvIGFwcGx5IHRvIHRoZSByZXF1ZXN0LlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gcmVxdWVzdC5hYm9ydFNpZ25hbCBBbiBBYm9ydFNpZ25hbCB0aGF0IGNhbiBiZSBtb25pdG9yZWQgZm9yIGNhbmNlbGxhdGlvbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVxdWVzdC50aW1lb3V0IFRoZSB0aW1lIHRvIHdhaXQgZm9yIHRoZSByZXF1ZXN0IHRvIGNvbXBsZXRlIGJlZm9yZSB0aHJvd2luZyBhIFRpbWVvdXRFcnJvci4gTWVhc3VyZWQgaW4gbWlsbGlzZWNvbmRzLlxuICAgICAqL1xuICAgIGNvbnN0IHJlcXVlc3RVUkwgPSAocmVxdWVzdCkgPT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UgKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgICAgICAgICB4aHIub3BlbihyZXF1ZXN0Lm1ldGhvZCwgcmVxdWVzdC51cmwsIHRydWUpO1xuICAgICAgICAgICAgLy94aHIud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdYLVJlcXVlc3RlZC1XaXRoJywgJ1hNTEh0dHBSZXF1ZXN0Jyk7XG5cbiAgICAgICAgICAgIC8vc2V0IGhlYWRlcnNcbiAgICAgICAgICAgIGlmIChyZXF1ZXN0LmhlYWRlcnMpIHtcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhyZXF1ZXN0LmhlYWRlcnMpXG4gICAgICAgICAgICAgICAgICAgIC5mb3JFYWNoKChoZWFkZXIpID0+IHhoci5zZXRSZXF1ZXN0SGVhZGVyKGhlYWRlciwgcmVxdWVzdC5oZWFkZXJzW2hlYWRlcl0pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9zZXQgcmVzcG9uc2UgdHlwZVxuICAgICAgICAgICAgaWYgKHJlcXVlc3QucmVzcG9uc2VUeXBlKSB7XG4gICAgICAgICAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9IHJlcXVlc3QucmVzcG9uc2VUeXBlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL2Fib3J0IHJlcVxuICAgICAgICAgICAgaWYgKHJlcXVlc3QuYWJvcnRTaWduYWwpIHtcbiAgICAgICAgICAgICAgICByZXF1ZXN0LmFib3J0U2lnbmFsLm9uYWJvcnQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHhoci5hYm9ydCgpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vdGltZW91dCB0aW1lXG4gICAgICAgICAgICBpZiAocmVxdWVzdC50aW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgeGhyLnRpbWVvdXQgPSByZXF1ZXN0LnRpbWVvdXQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vb24gc3RhdGUgY2hhbmdlXG4gICAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVxdWVzdC5hYm9ydFNpZ25hbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5hYm9ydFNpZ25hbC5vbmFib3J0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIFNvbWUgYnJvd3NlcnMgcmVwb3J0IHhoci5zdGF0dXMgPT0gMCB3aGVuIHRoZVxuICAgICAgICAgICAgICAgICAgICAvLyByZXNwb25zZSBoYXMgYmVlbiBjdXQgb2ZmIG9yIHRoZXJlJ3MgYmVlbiBhIFRDUCBGSU4uXG4gICAgICAgICAgICAgICAgICAgIC8vIFRyZWF0IGl0IGxpa2UgYSAyMDAgd2l0aCBubyByZXNwb25zZS5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDIwMCwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzVGV4dDogeGhyLnN0YXR1c1RleHQgfHwgbnVsbCwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogeGhyLnJlc3BvbnNlIHx8IHhoci5yZXNwb25zZVRleHQgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPCAzMDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IHhoci5zdGF0dXMsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1c1RleHQ6IHhoci5zdGF0dXNUZXh0LCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiB4aHIucmVzcG9uc2UgfHwgeGhyLnJlc3BvbnNlVGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvck1lc3NhZ2U6IHhoci5zdGF0dXNUZXh0LCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiB4aHIuc3RhdHVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvL2NhdGNoIGVycm9yc1xuICAgICAgICAgICAgeGhyLm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlOiB4aHIuc3RhdHVzVGV4dCwgXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IHhoci5zdGF0dXNcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vdGltZW91dFxuICAgICAgICAgICAgeGhyLm9udGltZW91dCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3Qoe1xuICAgICAgICAgICAgICAgICAgICBlcnJvck1lc3NhZ2U6ICdBIHRpbWVvdXQgb2NjdXJyZWQnLCBcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogJ3RpbWVvdXQnLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy9pbml0IHJlcVxuICAgICAgICAgICAgeGhyLnNlbmQocmVxdWVzdC5jb250ZW50IHx8ICcnKTtcbiAgICAgICAgfSk7XG5cdH07XG5cblx0LyoqXG5cdCAqIGxvYWRHYW1lXG5cdCAqIGRpc2FibGVkIHVudGlsIGZpZ3VyZSBiZXN0IHdheSB0byBkbyBjb2RlIHNwbGl0dGluZy4uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBnYW1lRmlsZSB1cmwgb2YgZ2FtZWZpbGUgdG8gbG9hZFxuICAgICAqIEBwYXJhbSB7Y2FsbGJhY2t9IGNiIENhbGxiYWNrIGZ1bmN0aW9uXG5cdCAqL1xuXHRjb25zdCBsb2FkR2FtZSA9IChnYW1lRmlsZSxjYikgPT4ge1xuXHRcdC8qXG5cdFx0IC8vcmVxdWVzdCBjb25mXG4gICAgICAgIHJlcXVlc3RVUkwoe1xuICAgICAgICAgICAgbWV0aG9kOiAnZ2V0JyxcbiAgICAgICAgICAgIHVybDogYCR7Y2FwdGNoYVNlcnZlcn0vY2FwdGNoYS9sb2FkLyR7Z2FtZUZpbGV9YFxuICAgICAgICAvL3N1Y2Nlc3NcbiAgICAgICAgfSkudGhlbigocmVzKSA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZygnW3Jlc11bbG9hZENvbmZdJyxyZXMpO1xuXHRcdFx0Y2IocmVzLmNvbnRlbnQpO1xuICAgICAgICAgICAgXG4gICAgICAgIC8vZXJyb3JcbiAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuXHRcdH0pO1xuXHRcdCovXG5cdH1cblxuXHQvKipcblx0ICogZ2FtZUNvbXBsZXRlZFxuXHQgKiBkaXNhYmxlZCB1bnRpbCBmaWd1cmUgYmVzdCB3YXkgdG8gZG8gY29kZSBzcGxpdHRpbmcuLi5cblx0ICovXG5cdGNvbnN0IGdhbWVDb21wbGV0ZWQgPSAoKSA9PiB7XG5cdFx0Lypcblx0XHRtbERhdGEuZmluaXNoVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdG1sRGF0YS5nYW1lc0NvbXBsZXRlZCArPSAxO1xuXHRcdHN1Ym1pdE1MRGF0YShcblx0XHQocmVzKSA9PiB7XG5cdFx0XHR2YXIgSlNFQ2FwdGNoYVBhc3MgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKTtcblx0XHRcdEpTRUNhcHRjaGFQYXNzLmluaXRFdmVudCgnSlNFQ2FwdGNoYVBhc3MnLCB0cnVlLCB0cnVlKTtcblx0XHRcdEpTRUNhcHRjaGFQYXNzLmlwID0gcmVzLmlwO1xuXHRcdFx0SlNFQ2FwdGNoYVBhc3MucmF0aW5nID0gcmVzLnJhdGluZztcblx0XHRcdEpTRUNhcHRjaGFQYXNzLnBhc3MgPSByZXMucGFzcztcblx0XHRcdGRvY3VtZW50LmRpc3BhdGNoRXZlbnQoSlNFQ2FwdGNoYVBhc3MpO1xuXHRcdFx0c2VsZi5KU0VDYXB0Y2hhQ29tcGxldGVkID0gdHJ1ZTtcblx0XHR9LCAocmVzKSA9PiB7XG5cdFx0XHRsb2FkUmFuZG9tR2FtZSgpO1xuXHRcdH0pOyovXG5cdH07XG5cblx0LyoqXG5cdCAqIGxvYWRSYW5kb21HYW1lXG5cdCAqIGxvYWRzIHJhbmRvbSBnYW1lIGZpeGVkIHRvIGFzdGVyb2lkcyBmb3Igbm93Li5cblx0ICovXG5cdGNvbnN0IGxvYWRSYW5kb21HYW1lID0gKCkgPT4ge1xuXHRcdC8vY29uc3QgZ2FtZXMgPSBbJ2FzdGVyb2lkcy5qcycsICd0aWN0YWN0b2UuanMnLCAncGlsb3QuanMnXTsgXG5cdFx0Y29uc3QgZ2FtZXMgPSBbJ2FzdGVyb2lkcy5qcyddOyBcblx0XHRjb25zdCBjaG9vc2VuR2FtZSA9IGdhbWVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpnYW1lcy5sZW5ndGgpXTtcblx0XHRsb2FkR2FtZShjaG9vc2VuR2FtZSwgKGdhbWVDb2RlKSA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZyhnYW1lQ29kZSk7XG5cdFx0XHRjb25zdCBnYW1lID0gbmV3IEZ1bmN0aW9uKGdhbWVDb2RlKTtcblx0XHRcdGdhbWUoKTtcblx0XHR9KTtcblx0fVxuXG5cdC8vRGF0YVxuIFx0Y29uc3QgbWxEYXRhID0ge1xuXHRcdGxvYWRUaW1lOiBuZXcgRGF0ZSgpLmdldFRpbWUoKSxcblx0XHR0aWNrVGltZTogMCxcblx0XHRmaW5pc2hUaW1lOiAwLFxuXHRcdG1vdXNlWDogMCxcblx0XHRtb3VzZVk6IDAsXG5cdFx0bW91c2VVcDogMCxcblx0XHRtb3VzZURvd246IDAsXG5cdFx0bW91c2VMZWZ0OiAwLFxuXHRcdG1vdXNlUmlnaHQ6IDAsXG5cdFx0bW91c2VDbGlja3M6IDAsXG5cdFx0bW91c2VFdmVudHM6IDAsXG5cdFx0bW91c2VQYXR0ZXJuOiBbXSxcblx0XHRnYW1lc0NvbXBsZXRlZDogMCxcblx0XHRjaGVja0JveDogMFxuXHR9O1xuXG5cdG1sRGF0YS51cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcblx0bWxEYXRhLnVzZXJBZ2VudCA9IG5hdmlnYXRvci51c2VyQWdlbnQgfHwgMDtcblx0bWxEYXRhLnBsYXRmb3JtID0gbmF2aWdhdG9yLnBsYXRmb3JtIHx8IDA7XG5cdG1sRGF0YS5yZWZlcnJlciA9IGRvY3VtZW50LnJlZmVycmVyIHx8IDA7XG5cdG1sRGF0YS5ydW5PbmNlID0gd2luZG93LkpTRVJ1bk9uY2UgfHwgZmFsc2U7XG5cdG1sRGF0YS5sYW5ndWFnZSA9IHdpbmRvdy5uYXZpZ2F0b3IubGFuZ3VhZ2UgfHwgMDtcblxuXHRpZiAobmF2aWdhdG9yLmxhbmd1YWdlcykgeyBcblx0XHRtbERhdGEubGFuZ3VhZ2VzID0gbmF2aWdhdG9yLmxhbmd1YWdlcy5qb2luKCcnKSB8fCAwO1xuXHR9IGVsc2Uge1xuXHRcdG1sRGF0YS5sYW5ndWFnZXMgPSAxO1xuXHR9XG5cblx0bWxEYXRhLnRpbWV6b25lT2Zmc2V0ID0gbmV3IERhdGUoKS5nZXRUaW1lem9uZU9mZnNldCgpIHx8IDA7XG5cdG1sRGF0YS5hcHBOYW1lID0gd2luZG93Lm5hdmlnYXRvci5hcHBOYW1lIHx8IDA7XG5cdG1sRGF0YS5zY3JlZW5XaWR0aCA9IHdpbmRvdy5zY3JlZW4ud2lkdGggfHwgMDtcblx0bWxEYXRhLnNjcmVlbkhlaWdodCA9IHdpbmRvdy5zY3JlZW4uaGVpZ2h0IHx8IDA7XG5cdG1sRGF0YS5zY3JlZW5EZXB0aCA9IHdpbmRvdy5zY3JlZW4uY29sb3JEZXB0aCB8fCAwO1xuXHRtbERhdGEuc2NyZWVuID0gbWxEYXRhLnNjcmVlbldpZHRoKyd4JyttbERhdGEuc2NyZWVuSGVpZ2h0Kyd4JyttbERhdGEuc2NyZWVuRGVwdGg7IC8vIDE5MjB4MTA4MHgyNFxuXHRtbERhdGEuaW5uZXJXaWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoIHx8IDA7XG5cdG1sRGF0YS5pbm5lckhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodCB8fCAwO1xuXHRtbERhdGEuZGV2aWNlTWVtb3J5ID0gbmF2aWdhdG9yLmRldmljZU1lbW9yeSB8fCBuYXZpZ2F0b3IuaGFyZHdhcmVDb25jdXJyZW5jeSB8fCAwO1xuXHRtbERhdGEucHJvdG9TdHJpbmcgPSBPYmplY3Qua2V5cyhuYXZpZ2F0b3IuX19wcm90b19fKS5qb2luKCcnKS5zdWJzdHJpbmcoMCwgMTAwKSB8fCAwO1xuXG5cdGlmICh3aW5kb3cuZnJhbWVFbGVtZW50ID09PSBudWxsKSB7XG5cdFx0bWxEYXRhLmlGcmFtZSA9IGZhbHNlO1xuXHR9IGVsc2Uge1xuXHRcdG1sRGF0YS5pRnJhbWUgPSB0cnVlO1xuXHR9XG5cdFxuXG5cblx0Ly9vbiBkZXRhaWxzIG9wZW5cblx0JDogaWYgKG9wZW4pIHtcblx0XHRtbERhdGEudGlja1RpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0XHRsb2FkUmFuZG9tR2FtZSgpO1xuXHR9IGVsc2Uge1xuXG5cdH1cblxuXHQvL2lucHV0IHNlbGVjdGVkXG5cdCQ6IG1sRGF0YS5jaGVja0JveCA9IChjYXB0Y2hhQ2hlY2spPzE6MDtcblxuXHQvL3RyYWNrIG1vdmVtZW50XG5cdGNvbnN0IGhhbmRsZU1vdmVtZW50ID0gKGUpID0+IHtcblx0XHRjb25zdCByZWN0ID0gZS5jdXJyZW50VGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdGlmIChlLnBhZ2VYID09PSBudWxsKSB7XG5cdFx0XHRjb25zdCBlRG9jID0gKGUudGFyZ2V0ICYmIGUudGFyZ2V0Lm93bmVyRG9jdW1lbnQpIHx8IGRvY3VtZW50O1xuXHRcdFx0Y29uc3QgZG9jID0gZURvYy5kb2N1bWVudEVsZW1lbnQ7XG5cdFx0XHRjb25zdCBib2R5ID0gZURvYy5ib2R5O1xuXHRcdFx0ZS5wYWdlWCA9IE1hdGguZmxvb3IoKGUudG91Y2hlcyAmJiBlLnRvdWNoZXNbMF0uY2xpZW50WCB8fCBlLmNsaWVudFggfHwgMCkgK1xuXHRcdFx0XHQoZG9jICYmIGRvYy5zY3JvbGxMZWZ0IHx8IGJvZHkgJiYgYm9keS5zY3JvbGxMZWZ0IHx8IDApIC1cblx0XHRcdFx0KGRvYyAmJiBkb2MuY2xpZW50TGVmdCB8fCBib2R5ICYmIGJvZHkuY2xpZW50TGVmdCB8fCAwKSk7XG5cdFx0XHRlLnBhZ2VZID0gTWF0aC5mbG9vcigoZS50b3VjaGVzICYmIGUudG91Y2hlc1swXS5jbGllbnRZIHx8IGUuY2xpZW50WSB8fCAwKSArXG5cdFx0XHRcdChkb2MgJiYgZG9jLnNjcm9sbFRvcCB8fCBib2R5ICYmIGJvZHkuc2Nyb2xsVG9wIHx8IDApIC1cblx0XHRcdFx0KGRvYyAmJiBkb2MuY2xpZW50VG9wIHx8IGJvZHkgJiYgYm9keS5jbGllbnRUb3AgfHwgMCkpO1xuXHRcdH1cblx0XHRjb25zdCBtb3VzZVggPSBlLnBhZ2VYIC0gcmVjdC5sZWZ0O1xuXHRcdGNvbnN0IG1vdXNlWSA9IGUucGFnZVkgLSByZWN0LnRvcDtcblxuXHRcdG1sRGF0YS5tb3VzZUV2ZW50cyArPSAxO1xuXHRcdGlmIChtb3VzZVkgPCBtbERhdGEubW91c2VZKSBtbERhdGEubW91c2VEb3duICs9IDE7XG5cdFx0aWYgKG1vdXNlWSA+IG1sRGF0YS5tb3VzZVkpIG1sRGF0YS5tb3VzZVVwICs9IDE7XG5cdFx0aWYgKG1vdXNlWCA+IG1sRGF0YS5tb3VzZVgpIG1sRGF0YS5tb3VzZVJpZ2h0ICs9IDE7XG5cdFx0aWYgKG1vdXNlWCA8IG1sRGF0YS5tb3VzZVgpIG1sRGF0YS5tb3VzZUxlZnQgKz0gMTtcblxuXHRcdG1sRGF0YS5tb3VzZVggPSBtb3VzZVg7XG5cdFx0bWxEYXRhLm1vdXNlWSA9IG1vdXNlWTtcblx0XHRtbERhdGEubW91c2VQYXR0ZXJuLnB1c2gocGFyc2VJbnQobW91c2VYKSArICd4JyArIHBhcnNlSW50KG1vdXNlWSkpO1xuXHR9XG5cdFxuXHRjb25zdCBjYWxsYmFja0Z1bmN0aW9uID0gKGUpID0+IHtcblx0XHRjb25zb2xlLmxvZygnY29tcGxldGUnKVxuXHRcdG1sRGF0YS5nYW1lc0NvbXBsZXRlZCArPSAxO1xuXHRcdG1sRGF0YS5tb3VzZUNsaWNrcyA9IGUuZGV0YWlsLm1vdXNlQ2xpY2tzO1xuXHRcdG1sRGF0YS5maW5pc2hUaW1lID0gZS5kZXRhaWwuZmluaXNoVGltZTsgXG5cdFx0XG5cdFx0Ly9jbG9zZSBjYXB0Y2hhXG5cdFx0b3BlbiA9IGZhbHNlO1xuXG5cdFx0Ly9zdWJtaXQgZGF0YVxuXHRcdHN1Ym1pdE1MRGF0YShcblx0XHRcdChyZXMpID0+IHtcblx0XHRcdFx0Y29uc3QgSlNFQ2FwdGNoYVBhc3MgPSB7fTtcblx0XHRcdFx0SlNFQ2FwdGNoYVBhc3MuaXAgPSByZXMuaXA7XG5cdFx0XHRcdEpTRUNhcHRjaGFQYXNzLnJhdGluZyA9IHJlcy5yYXRpbmc7XG5cdFx0XHRcdEpTRUNhcHRjaGFQYXNzLnBhc3MgPSByZXMucGFzcztcblx0XHRcdFx0XG5cdFx0XHRcdGRpc3BhdGNoKCdzdWNjZXNzJywgSlNFQ2FwdGNoYVBhc3MpO1xuXHRcdFx0XHRjb21wbGV0ZSA9IHRydWU7XG5cdFx0XHR9LCBcblx0XHRcdChyZXMpID0+IHtcblx0XHRcdFx0b3BlbiA9IHRydWU7XG5cdFx0XHRcdGRpc3BhdGNoKCdmYWlsJywgMSk7XG5cdFx0XHRcdGxvYWRSYW5kb21HYW1lKCk7XG5cdFx0XHR9XG5cdFx0KTtcblx0fVxuXG5cblx0LyoqXG5cdCAqIHN1Ym1pdE1MRGF0YVxuXHQgKiBzdWJtaXQgZGF0YSB3aXRoIGNhbGxiYWNrIGNvZGUgc3VjY2VzIGZhaWxcbiAgICAgKiBAcGFyYW0ge2NhbGxiYWNrfSBwYXNzQ2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge2NhbGxiYWNrfSBmYWlsQ2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb25cblx0ICovXG5cdGNvbnN0IHN1Ym1pdE1MRGF0YSA9IChwYXNzQ2FsbGJhY2ssIGZhaWxDYWxsYmFjaykgPT4ge1xuXHRcdGNvbnN0IGNsZWFuRGF0YVN0cmluZyA9IHByZXBNTERhdGEoKTtcblx0XHR0aGlua2luZyA9IHRydWU7XG5cdFx0cmVxdWVzdFVSTCh7XG4gICAgICAgICAgICBtZXRob2Q6ICdwb3N0Jyxcblx0XHRcdHVybDogYCR7Y2FwdGNoYVNlcnZlcn0vY2FwdGNoYS9yZXF1ZXN0L2AsXG5cdFx0XHRjb250ZW50OiBjbGVhbkRhdGFTdHJpbmcsXG5cdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdCdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG5cdFx0XHR9LFxuICAgICAgICAvL3N1Y2Nlc3NcbiAgICAgICAgfSkudGhlbigocmVzKSA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZygnW3Jlc11bbG9hZENvbmZdJyxyZXMpO1xuXHRcdFx0dGhpbmtpbmcgPSBmYWxzZTtcblx0XHRcdHJlcyA9IEpTT04ucGFyc2UocmVzLmNvbnRlbnQpO1xuXHRcdFx0aWYgKChyZXMucGFzcykgJiYgKHJlcy5wYXNzID09PSB0cnVlKSkge1xuXHRcdFx0XHRwYXNzQ2FsbGJhY2socmVzKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGZhaWxDYWxsYmFjayhyZXMpO1xuXHRcdFx0fVxuICAgICAgICAvL2Vycm9yXG4gICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoZXJyKTtcblx0XHRcdGZhaWxDYWxsYmFjayhyZXMpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBwcmVwTUxEYXRhXG5cdCAqIFByZXBhcmUgTUwgZGF0YVxuXHQgKi9cblx0Y29uc3QgcHJlcE1MRGF0YSA9ICgpID0+IHtcblx0XHRjb25zdCBjbGVhbkRhdGEgPSBtbERhdGE7XG5cdFx0Y2xlYW5EYXRhLm1vdXNlUGF0dGVybiA9IGNsZWFuRGF0YS5tb3VzZVBhdHRlcm4uc2xpY2UoY2xlYW5EYXRhLm1vdXNlUGF0dGVybi5sZW5ndGgtMjAwLGNsZWFuRGF0YS5tb3VzZVBhdHRlcm4ubGVuZ3RoKTtcblx0XHRyZXR1cm4gSlNPTi5zdHJpbmdpZnkoe21sRGF0YTogY2xlYW5EYXRhfSk7XG5cdH07XG48L3NjcmlwdD5cblxuXG5cblxuPCEtLSBJTVBPUlRBTlQgV2hlbiBkZXZlbG9waW5nIGFkZCBnbG9iYWwgYXR0cmlidXRlIC0tPlxuPHN0eWxlPlxuXG5kbCB7XG5cdGZvbnQtZmFtaWx5OmFyaWFsO1xuXHRib3gtc2hhZG93OiAwcHggMHB4IDBweCAycHggcmdiYSgwLCAwLCAwLCAwLjA2KTtcblx0Ym9yZGVyLXJhZGl1czo0cHg7XG4gICAgbWFyZ2luOiAyMHB4IDBweCAyMHB4O1xuICAgIG1pbi13aWR0aDogMjAwcHg7XG4gICAgbWF4LXdpZHRoOiAzMTRweDtcbn1cbmR0IHtcbiAgICBtYXJnaW4tdG9wOiAtNnB4O1xuICAgIGJhY2tncm91bmQ6ICNmZmY7XG4gICAgLyogZGlzcGxheTogaW5saW5lLWJsb2NrOyAqL1xuICAgIG1hcmdpbi1sZWZ0OiAxMHB4O1xuICAgIHBhZGRpbmc6IDBweCAxMHB4O1xuICAgIGZsb2F0OiBsZWZ0O1xuICAgIGNsZWFyOiBib3RoO1xuXHRmb250LXdlaWdodDpib2xkO1xuXHR0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2U7XG5cdGZvbnQtc2l6ZToxMHB4O1xuXHRsZXR0ZXItc3BhY2luZzoxcHg7XG5cdGNvbG9yOiM2NjY7XG59XG5cbmRkIHtcbiAgICBtYXJnaW46IDBweDtcbiAgICBjbGVhcjogYm90aDtcbiAgICBwYWRkaW5nOiAxMHB4O1xufVxuI0pTRS1ERUJVRyB7XG5cdGRpc3BsYXk6ZmxleDtcbn1cbiNKU0UtREVCVUcgPiBkaXYge1xuXHRmbGV4OjE7XG5cdGZvbnQtd2VpZ2h0OmJvbGQ7XG5cdHRleHQtdHJhbnNmb3JtOnVwcGVyY2FzZTtcblx0Zm9udC1zaXplOjExcHg7XG5cdGxldHRlci1zcGFjaW5nOjFweDtcblx0Y29sb3I6IzY2Njtcbn1cbi8qKlxuKiBGTEFUXG4qKi9cbiNKU0UtQ2FwdGNoYS5mbGF0IHtcblx0YmFja2dyb3VuZDogbm9uZTtcblx0cGFkZGluZzogMHB4O1xufVxuXG4jSlNFLUNhcHRjaGEuZmxhdCBkZXRhaWxzIHtcblx0Ym94LXNoYWRvdzogMHB4IDBweCAwcHggNHB4IHJnYmEoMCwgMCwgMCwgMC4wNik7XG59XG5cblxuLyoqKiovXG5cblxuLyoqXG4qIFNNQUxMXG4qKi9cbiNKU0UtQ2FwdGNoYS5TIHtcblx0Ym9yZGVyLXJhZGl1czogNnB4O1xuXHRmb250LXNpemU6IDExcHg7XG59XG5cbiNKU0UtQ2FwdGNoYS5TICNKU0UtaW5wdXQge1xuXHRoZWlnaHQ6IDIwcHg7XG5cdG1pbi13aWR0aDogMjBweDtcblx0Zm9udC1zaXplOiAxNXB4O1xuXHRib3JkZXI6IHNvbGlkIDFweCAjRDNEOEREO1xuXHRwYWRkaW5nOiAxcHg7XG5cdG1hcmdpbjogNnB4O1xufVxuXG4jSlNFLUNhcHRjaGEuUyAjSlNFLWJyYW5kIHtcblx0d2lkdGg6IDMwcHg7XG4gICAgaGVpZ2h0OiAzOHB4O1xuXHRib3JkZXItbGVmdDogc29saWQgMnB4ICNGOUY5Rjk7XG59XG5cbiNKU0UtQ2FwdGNoYS5TICNKU0UtYnJhbmQgc3ZnIHtcblx0d2lkdGg6IDI0cHg7XG59XG5cbiNKU0UtQ2FwdGNoYS5TLmZsYXQgZGV0YWlscyB7XG5cdGJveC1zaGFkb3c6IDBweCAwcHggMHB4IDJweCByZ2JhKDAsIDAsIDAsIDAuMDYpO1xufVxuI0pTRS1DYXB0Y2hhLlMuc3VjY2VzcyAjSlNFLWlucHV0IHtcblx0bWluLXdpZHRoOjUycHg7XG59XG4vKioqKi9cblxuLyoqXG4qIE1FRElVTVxuKiovXG4jSlNFLUNhcHRjaGEuTSB7XG5cdGJvcmRlci1yYWRpdXM6IDZweDtcblx0Zm9udC1zaXplOiAxNnB4O1xufVxuXG4jSlNFLUNhcHRjaGEuTSAjSlNFLWlucHV0IHtcblx0aGVpZ2h0OiAzMHB4O1xuXHRtaW4td2lkdGg6IDMwcHg7XG5cdGZvbnQtc2l6ZTogMjBweDtcblx0Ym9yZGVyOiBzb2xpZCAycHggI0QzRDhERDtcblx0bWFyZ2luOiA4cHg7XG59XG5cbiNKU0UtQ2FwdGNoYS5NICNKU0UtYnJhbmQge1xuXHR3aWR0aDogMzhweDtcblx0Ym9yZGVyLWxlZnQ6IHNvbGlkIDJweCAjRjlGOUY5O1xuXHRoZWlnaHQ6NTBweDtcbn1cblxuI0pTRS1DYXB0Y2hhLk0gI0pTRS1icmFuZCBzdmcge1xuXHR3aWR0aDogMzRweDtcbn1cblxuI0pTRS1DYXB0Y2hhLk0uZmxhdCBkZXRhaWxzIHtcblx0Ym94LXNoYWRvdzogMHB4IDBweCAwcHggMnB4IHJnYmEoMCwgMCwgMCwgMC4wNik7XG59XG4jSlNFLUNhcHRjaGEuTS5zdWNjZXNzICNKU0UtaW5wdXQge1xuXHRtaW4td2lkdGg6NzBweDtcbn1cbi8qKioqL1xuXG4vKipcbiogTEFSR0VcbioqL1xuI0pTRS1DYXB0Y2hhLkwge31cblxuI0pTRS1DYXB0Y2hhLnN1Y2Nlc3MgI0pTRS1pbnB1dCB7XG5cdG1pbi13aWR0aDo5MnB4O1xufVxuI0pTRS1DYXB0Y2hhICNKU0UtYnJhbmQge1xuXHRoZWlnaHQ6NjhweFxufVxuLyoqKiovXG5cblxuLyoqXG4qIEJBU0VcbioqL1xuI2NhcHRjaGFDaGVjayB7IFxuXHRkaXNwbGF5Om5vbmU7XG59XG4jSlNFLUNhcHRjaGEge1xuXHRkaXNwbGF5Om5vbmU7XG5cdGJhY2tncm91bmQ6ICNGMkY4RkY7XG5cdGJvcmRlci1yYWRpdXM6IDZweDtcblx0Y2xlYXI6IGJvdGg7XG5cdHBhZGRpbmc6IDEzcHg7XG5cdG1pbi13aWR0aDogMjAwcHg7XG5cdG1heC13aWR0aDogMzE0cHg7XG5cdGNvbG9yOiAjNzA3MDcwO1xuXHRmb250LXNpemU6IDIwcHg7XG5cdGZvbnQtZmFtaWx5OiAnTW9udHNlcnJhdCcsIHNhbnMtc2VyaWY7XG59XG5cbiNKU0UtQ2FwdGNoYSAqIHtcblx0LXdlYmtpdC11c2VyLXNlbGVjdDogbm9uZTtcblx0ICAgLW1vei11c2VyLXNlbGVjdDogbm9uZTtcblx0ICAgIC1tcy11c2VyLXNlbGVjdDogbm9uZTtcblx0ICAgICAgICB1c2VyLXNlbGVjdDogbm9uZTtcbn1cblxuI0pTRS1DYXB0Y2hhIGRldGFpbHMge1xuXHRvdmVyZmxvdzogaGlkZGVuO1xuXHRtYXJnaW46IDBweDtcblx0YmFja2dyb3VuZDogI2ZmZjtcblx0Ym9yZGVyLXJhZGl1czogNHB4O1xuXHRib3gtc2hhZG93OiAwcHggM3B4IDZweCAwcHggcmdiYSgwLCAwLCAwLCAwLjEyKTtcbn1cblxuI0pTRS1DYXB0Y2hhIGRldGFpbHMgc3VtbWFyeSB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdG91dGxpbmU6IG5vbmU7XG59XG5cbiNKU0UtQ2FwdGNoYSBkZXRhaWxzICNKU0UtQ2FwdGNoYURpc3BsYXkge1xuXHRvcGFjaXR5OiAwO1xuXHRtYXJnaW46IDBweDtcblx0cGFkZGluZzogMHB4O1xuXHRoZWlnaHQ6IDBweDtcblx0dHJhbnNpdGlvbjogb3BhY2l0eSAwLjJzLCBoZWlnaHQgMC40cztcblx0YmFja2dyb3VuZDogI2ZmZjtcbn1cblxuI0pTRS1DYXB0Y2hhIGRldGFpbHMuY2FwdGNoYVBhbmVsW29wZW5dICNKU0UtQ2FwdGNoYURpc3BsYXkge1xuXHQtd2Via2l0LWFuaW1hdGlvbi1uYW1lOiBzbGlkZURvd247XG5cdCAgICAgICAgYW5pbWF0aW9uLW5hbWU6IHNsaWRlRG93bjtcblx0LXdlYmtpdC1hbmltYXRpb24tZHVyYXRpb246IDAuM3M7XG5cdCAgICAgICAgYW5pbWF0aW9uLWR1cmF0aW9uOiAwLjNzO1xuXHQtd2Via2l0LWFuaW1hdGlvbi1maWxsLW1vZGU6IGZvcndhcmRzO1xuXHQgICAgICAgIGFuaW1hdGlvbi1maWxsLW1vZGU6IGZvcndhcmRzO1xuXHQtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogMC4zcztcblx0ICAgICAgICBhbmltYXRpb24tZGVsYXk6IDAuM3M7XG59XG5cbiNKU0UtQ2FwdGNoYSAjSlNFLWlucHV0IHtcblx0Ym9yZGVyOiBzb2xpZCA0cHggI0QzRDhERDtcblx0Ym9yZGVyLXJhZGl1czogNHB4O1xuXHRtYXJnaW46IDEwcHg7XG5cdG1pbi13aWR0aDogNDBweDtcblx0aGVpZ2h0OiA0MHB4O1xuXHRjdXJzb3I6IHBvaW50ZXI7XG5cdGZvbnQtc2l6ZTogMjhweDtcblx0dGV4dC1hbGlnbjogY2VudGVyO1xuXHRwb3NpdGlvbjogcmVsYXRpdmU7XG5cdG92ZXJmbG93OiBoaWRkZW47XG59XG5cbiNKU0UtQ2FwdGNoYSBkZXRhaWxzPnN1bW1hcnk6Oi13ZWJraXQtZGV0YWlscy1tYXJrZXIge1xuXHRkaXNwbGF5OiBub25lO1xufVxuXG4jSlNFLUNhcHRjaGEgZGV0YWlscyAjSlNFLWlucHV0OmhvdmVyOmJlZm9yZSB7XG5cdGNvbnRlbnQ6ICfwn6SWJztcblx0b3BhY2l0eTogMTtcbn1cblxuI0pTRS1DYXB0Y2hhLnN1Y2Nlc3MgZGV0YWlscyAjSlNFLWlucHV0OmJlZm9yZSB7XG5cdGNvbnRlbnQ6ICfwn5iJJztcblx0b3BhY2l0eTogMTtcbn1cbiNKU0UtQ2FwdGNoYS5mYWlsZWQgZGV0YWlscyAjSlNFLWlucHV0OmJlZm9yZSB7XG5cdGNvbnRlbnQ6ICfwn6SWJztcblx0b3BhY2l0eTogMTtcbn1cblxuI0pTRS1DYXB0Y2hhLnRoaW5raW5nIGRldGFpbHMgI0pTRS1pbnB1dDpiZWZvcmUge1xuXHRjb250ZW50OiAn8J+koSc7XG5cdG9wYWNpdHk6IDE7XG59XG4jSlNFLUNhcHRjaGEuc3VjY2VzcyBkZXRhaWxzICNKU0UtaW5wdXQ6YWZ0ZXIge1xuXHRjb250ZW50OiAn4pyUJztcblx0b3BhY2l0eTogMTtcblx0Y29sb3I6ICMyNkFFNjA7XG5cdHBhZGRpbmc6IDBweCA0cHggMHB4IDVweDtcblx0Ym9yZGVyLWxlZnQ6IHNvbGlkIDJweCAjRDNEOEREO1xufVxuXG4jSlNFLUNhcHRjaGEuZmFpbGVkIGRldGFpbHMgI0pTRS1pbnB1dDphZnRlciB7XG5cdGNvbnRlbnQ6ICfim5QnO1xuXHRvcGFjaXR5OiAxO1xuXHRwYWRkaW5nOiAwcHg7XG5cdGJvcmRlci1sZWZ0OiBzb2xpZCAycHggI0QzRDhERDtcbn1cblxuXG4jSlNFLUNhcHRjaGEuc3VjY2VzcyBkZXRhaWxzLmNhcHRjaGFQYW5lbFtvcGVuXSAjSlNFLWlucHV0OmFmdGVyIHtcblx0Y29udGVudDogJyc7XG5cdG9wYWNpdHk6IDA7XG5cdHBhZGRpbmc6IDBweDtcblx0Ym9yZGVyOiAwcHg7XG5cdFxufVxuXG4jSlNFLUNhcHRjaGEgZGV0YWlscyAjSlNFLWlucHV0OmJlZm9yZSxcbiNKU0UtQ2FwdGNoYSBkZXRhaWxzLmNhcHRjaGFQYW5lbFtvcGVuXSAjSlNFLWlucHV0OmJlZm9yZSB7XG5cdG9wYWNpdHk6IDA7XG5cdC8qZm9udC1zaXplOiAyOHB4OyovXG5cdGNvbnRlbnQ6ICfwn6SWJztcblx0dHJhbnNpdGlvbjogb3BhY2l0eSAwLjJzO1xuXHRwb3NpdGlvbjogYWJzb2x1dGU7XG5cdHRvcDowcHg7XG5cdGxlZnQ6MHB4O1xuXHRib3R0b206MHB4O1xuXHRyaWdodDowcHg7XG5cdGJhY2tncm91bmQ6I2ZmZjtcbn1cbiNKU0UtQ2FwdGNoYS5zdWNjZXNzIGRldGFpbHMuY2FwdGNoYVBhbmVsICNKU0UtaW5wdXQ6YmVmb3JlIHtcblx0cmlnaHQ6NTAlO1xufVxuI0pTRS1DYXB0Y2hhLnN1Y2Nlc3MgZGV0YWlscy5jYXB0Y2hhUGFuZWxbb3Blbl0gI0pTRS1pbnB1dDphZnRlciB7XG5cdGRpc3BsYXk6IG5vbmU7XG59XG4jSlNFLUNhcHRjaGEuc3VjY2VzcyBkZXRhaWxzLmNhcHRjaGFQYW5lbCAjSlNFLWlucHV0OmFmdGVyIHtcblx0bGVmdDo1MCU7XG5cdHBvc2l0aW9uOiBhYnNvbHV0ZTtcblx0dG9wOjBweDtcblx0Ym90dG9tOjBweDtcblx0cmlnaHQ6MHB4O1xuXHRiYWNrZ3JvdW5kOiNmZmY7XG59XG4jSlNFLUNhcHRjaGEuc3VjY2VzcyAjSlNFLWlucHV0IHtcblx0bWluLXdpZHRoOjkycHg7XG59XG4jSlNFLUNhcHRjaGEuc3VjY2VzcyBkZXRhaWxzLmNhcHRjaGFQYW5lbFtvcGVuXSAjSlNFLWlucHV0IHtcblx0bWluLXdpZHRoOjIwcHg7XG59XG5cbiNKU0UtQ2FwdGNoYSBkZXRhaWxzLmNhcHRjaGFQYW5lbFtvcGVuXSAjSlNFLWlucHV0OmJlZm9yZSB7XG5cdG9wYWNpdHk6IDE7XG59XG5cbiNKU0UtQ2FwdGNoYSAjSlNFLW1zZyB7XG5cdGFsaWduLXNlbGY6IGNlbnRlcjtcblx0cGFkZGluZzogMHB4IDBweCAwcHggNHB4O1xuXHRmbGV4OiAxO1xufVxuXG4jSlNFLUNhcHRjaGEgI0pTRS1tc2cgcCB7XG5cdHZlcnRpY2FsLWFsaWduOiBib3R0b207XG5cdGRpc3BsYXk6IGlubGluZS1ibG9jaztcblx0bWFyZ2luOiAwcHg7XG5cdGxpbmUtaGVpZ2h0OiAxLjI7XG59XG5cbiNKU0UtQ2FwdGNoYSAjSlNFLWJyYW5kIHtcblx0Ym9yZGVyLWxlZnQ6IHNvbGlkIDNweCAjRjlGOUY5O1xuXHRhbGlnbi1zZWxmOiBjZW50ZXI7XG5cdHdpZHRoOiA2MHB4O1xuXHRoZWlnaHQ6NjhweDtcblx0cGFkZGluZzogMHB4IDRweDtcblx0dGV4dC1hbGlnbjogY2VudGVyO1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgYWxpZ24tY29udGVudDogY2VudGVyO1xufVxuXG4jSlNFLUNhcHRjaGEgI0pTRS1icmFuZCBzdmcge1xuXHRmaWxsOiAjNTFCRkVDO1xuXHR3aWR0aDogNDhweDtcbn1cblxuI0pTRS1DYXB0Y2hhICNKU0UtQ2FwdGNoYURpc3BsYXkgI0pTRS1jYXB0Y2hhLWdhbWUtY29udGFpbmVyIHtcblx0YmFja2dyb3VuZDogI0YyRjhGRjtcblx0Ym9yZGVyLXJhZGl1czogNnB4O1xuXHRoZWlnaHQ6IDEwMCU7XG5cdHBvc2l0aW9uOnJlbGF0aXZlO1xuXHRvdmVyZmxvdzpoaWRkZW47XG59XG4jSlNFLUNhcHRjaGEgI0pTRS1DYXB0Y2hhRGlzcGxheSAjSlNFLWNhcHRjaGEtZ2FtZSB7XG5cdGhlaWdodDoxMDAlO1xufVxuXG5cbkAtd2Via2l0LWtleWZyYW1lcyBzbGlkZURvd24ge1xuXHRmcm9tIHtcblx0XHRvcGFjaXR5OiAwO1xuXHRcdGhlaWdodDogMDtcblx0XHRwYWRkaW5nOiA4cHg7XG5cdFx0Ym9yZGVyLXRvcDogc29saWQgNHB4ICNGOUY5Rjk7XG5cdH1cblxuXHR0byB7XG5cdFx0b3BhY2l0eTogMTtcblx0XHRoZWlnaHQ6IDE5MHB4O1xuXHRcdHBhZGRpbmc6IDhweDtcblx0XHRib3JkZXItdG9wOiBzb2xpZCA0cHggI0Y5RjlGOTtcblx0XHQvKmhlaWdodDogdmFyKC0tY29udGVudEhlaWdodCk7Ki9cblx0fVxufVxuXG5cbkBrZXlmcmFtZXMgc2xpZGVEb3duIHtcblx0ZnJvbSB7XG5cdFx0b3BhY2l0eTogMDtcblx0XHRoZWlnaHQ6IDA7XG5cdFx0cGFkZGluZzogOHB4O1xuXHRcdGJvcmRlci10b3A6IHNvbGlkIDRweCAjRjlGOUY5O1xuXHR9XG5cblx0dG8ge1xuXHRcdG9wYWNpdHk6IDE7XG5cdFx0aGVpZ2h0OiAxOTBweDtcblx0XHRwYWRkaW5nOiA4cHg7XG5cdFx0Ym9yZGVyLXRvcDogc29saWQgNHB4ICNGOUY5Rjk7XG5cdFx0LypoZWlnaHQ6IHZhcigtLWNvbnRlbnRIZWlnaHQpOyovXG5cdH1cbn1cblxuI0pTRS1DYXB0Y2hhIGRldGFpbHMgI0pTRS1tc2c+cDphZnRlciB7XG5cdGNvbnRlbnQ6ICdJbSBodW1hbic7XG59XG5cbiNKU0UtQ2FwdGNoYSBkZXRhaWxzLmNhcHRjaGFQYW5lbFtvcGVuXSAjSlNFLW1zZz5wOmFmdGVyLFxuI0pTRS1DYXB0Y2hhLnN1Y2Nlc3MgZGV0YWlscy5jYXB0Y2hhUGFuZWxbb3Blbl0gI0pTRS1tc2c+cDphZnRlciB7XG5cdGNvbnRlbnQ6ICdJbSBub3QgYSByb2JvdCc7XG59XG5cbiNKU0UtQ2FwdGNoYS5zdWNjZXNzIGRldGFpbHMgI0pTRS1tc2c+cDphZnRlciB7XG5cdGNvbnRlbnQ6ICdWZXJpZmllZCBodW1hbic7XG59XG4jSlNFLUNhcHRjaGEuZmFpbGVkIGRldGFpbHMgI0pTRS1tc2c+cDphZnRlciB7XG5cdGNvbnRlbnQ6ICdGYWlsZWQgdmVyaWZpY2F0aW9uJztcbn1cbiNKU0UtQ2FwdGNoYS50aGlua2luZyBkZXRhaWxzICNKU0UtbXNnPnA6YWZ0ZXIge1xuXHRjb250ZW50OiAnVmVyaWZ5aW5nIC4uLic7XG59XG5cbiNKU0UtaW5wdXQgaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdIHtcblx0Lypwb3NpdGlvbjogYWJzb2x1dGU7XG5cdHRvcDogLTUwcHg7Ki9cbn1cbiNKU0UtQ2FwdGNoYS5hY3RpdmUge1xuXHRkaXNwbGF5OmJsb2NrO1xufVxuLyoqKiovXG5cblxuLmdmeCB7XG5cdHBvc2l0aW9uOmFic29sdXRlO1xuXHRvcGFjaXR5OjE7XG5cdHRyYW5zaXRpb246IG9wYWNpdHkgMC42cztcbn1cblxuLmdmeC5hY3RpdmUge1xuXHRvcGFjaXR5OjA7XG59XG5cblxuLmdhbWUge1xuXHRoZWlnaHQ6MTAwJTtcblx0YmFja2dyb3VuZC1zaXplOjM1MHB4O1xuXHRiYWNrZ3JvdW5kLXJlcGVhdDpuby1yZXBlYXQ7XG5cdGJhY2tncm91bmQtaW1hZ2U6dXJsKFwiZGF0YTppbWFnZS9zdmcreG1sLCUzQ3N2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyNTQuNzMyJyBoZWlnaHQ9JzE0Mi42NScgdmlld0JveD0nMCAwIDI1NC43MzIgMTQyLjY1JyUzRSUzQ3JlY3Qgd2lkdGg9JzI1NC43MzInIGhlaWdodD0nMTQyLjY1JyBmaWxsPSclMjMyNjEzNmUnLyUzRSUzQ2cgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTMuNzk5IDguMzI2KSclM0UlM0NnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDY2LjcyNSAxNi4xNTcpJyUzRSUzQ3BhdGggZD0nTTYwMC4wNDIsMjYxLjg4M0E0Ni44NDIsNDYuODQyLDAsMSwwLDU1My4yLDIxNS4wNDJhNDYuOTMsNDYuOTMsMCwwLDAsNDYuODQyLDQ2Ljg0MlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC01NTMuMiAtMTY4LjIpJyBmaWxsPSclMjMzMzExNzgnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNNjM3LjAzOSwyOTIuNTc4QTQwLjUzOSw0MC41MzksMCwxLDAsNTk2LjUsMjUyLjAzOWE0MC42MTYsNDAuNjE2LDAsMCwwLDQwLjUzOSw0MC41MzlaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNTkwLjE5NyAtMjA1LjE5NyknIGZpbGw9JyUyMzNhMTU4MCcgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J002OTQuNTQyLDM0MC4yODVBMzAuNzQzLDMwLjc0MywwLDEsMCw2NjMuOCwzMDkuNTQzYTMwLjgwNywzMC44MDcsMCwwLDAsMzAuNzQyLDMwLjc0M1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC02NDcuNzAxIC0yNjIuNzAxKScgZmlsbD0nJTIzNDQxNThmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTc1MS41MzQsMzg3LjU2N0EyMS4wMzQsMjEuMDM0LDAsMSwwLDczMC41LDM2Ni41MzRhMjEuMDcyLDIxLjA3MiwwLDAsMCwyMS4wMzQsMjEuMDM0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTcwNC42OTIgLTMxOS42OTIpJyBmaWxsPSclMjM1MjFiOTYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDL2clM0UlM0NnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDApJyUzRSUzQ3BhdGggZD0nTTExMi40MTMsOTIuNDExQTE3LjYwNiwxNy42MDYsMCwxLDAsOTQuOCw3NC44YTE3LjY0MywxNy42NDMsMCwwLDAsMTcuNjEzLDE3LjYxM1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC05NC44IC01Ny4yKScgZmlsbD0nJTIzMzQxMjcwJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTEyNi4zNCwxMDMuOTY2YTE1LjIzMywxNS4yMzMsMCwxLDAtMTUuMjQtMTUuMjQsMTUuMjYsMTUuMjYsMCwwLDAsMTUuMjQsMTUuMjRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTA4LjcyNyAtNzEuMTI3KScgZmlsbD0nJTIzM2QxMjczJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE0Ny45NTgsMTIxLjlBMTEuNTUsMTEuNTUsMCwxLDAsMTM2LjQsMTEwLjM0MywxMS41NzMsMTEuNTczLDAsMCwwLDE0Ny45NTgsMTIxLjlaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTMwLjM0NSAtOTIuNzQ1KScgZmlsbD0nJTIzNDkxMjc5JyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE2OS40LDEzOS42MDhhNy45LDcuOSwwLDEsMC03LjktNy45LDcuOTIxLDcuOTIxLDAsMCwwLDcuOSw3LjlaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTUxLjc5MSAtMTE0LjEwNiknIGZpbGw9JyUyMzU1MTQ3ZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0MvZyUzRSUzQ2cgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTkxLjc3NyAxNC45MDUpJyUzRSUzQ3BhdGggZD0nTTE0MTguOTUyLDE3Mi45YTYuNjUyLDYuNjUyLDAsMSwwLTYuNjUyLTYuNjUyLDYuNjYsNi42NiwwLDAsMCw2LjY1Miw2LjY1MlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xNDEyLjMgLTE1OS42KScgZmlsbD0nJTIzMzQxMjcwJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE0MjQuMjQ5LDE3Ny4zMTRhNS43NTcsNS43NTcsMCwxLDAtNS43NS01Ljc1LDUuNzc0LDUuNzc0LDAsMCwwLDUuNzUsNS43NVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xNDE3LjU5NyAtMTY0Ljg5OCknIGZpbGw9JyUyMzNkMTI3MycgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNDMyLjM2NywxODQuMDM0YTQuMzY3LDQuMzY3LDAsMSwwLTQuMzY3LTQuMzY3LDQuMzgsNC4zOCwwLDAsMCw0LjM2Nyw0LjM2N1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xNDI1LjcxNSAtMTczLjAxNSknIGZpbGw9JyUyMzQ5MTI3OScgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNDQwLjQ4NCwxOTAuNzY4YTIuOTg0LDIuOTg0LDAsMSwwLTIuOTg0LTIuOTg0LDIuOTg4LDIuOTg4LDAsMCwwLDIuOTg0LDIuOTg0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTE0MzMuODMyIC0xODEuMTMyKScgZmlsbD0nJTIzNTUxNDdmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQy9nJTNFJTNDL2clM0UlM0NnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDE5OC45OTcgNjUuNDg4KSclM0UlM0NwYXRoIGQ9J00xMzc3LjQzMyw0NzAuMzhhMTAuMjQsMTAuMjQsMCwxLDAtMTAuMjMzLTEwLjI0NywxMC4yNjMsMTAuMjYzLDAsMCwwLDEwLjIzMywxMC4yNDdaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTM2Ny4xODUgLTQ0OS45KScgZmlsbD0nJTIzZjY2JyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTEzOTEuMDc2LDQ0OS45YTEwLjI0LDEwLjI0LDAsMSwxLDAsMjAuNDhjLTEuMDMzLS4yNzctMy4yLS40NTEtMi44NTMtMS40MTIuMTc1LS40OCwxLjU0My4xODksMi45LjMwNiwxLjgwNS4xMzEsMy43LS4yMzMsMy45MTYtLjgxNS4zMDYtLjg3My0xLjg2My0uMjkxLTQuMzY3LS40MjItMi45NjktLjE2LTYuMzc2LTEuMDMzLTYuMjg4LTIuNDE2LjA3My0xLjA0OCwzLjA1Ny4zMDYsNiwuNTY4LDMsLjI3Nyw1Ljk1My0uNTUzLDYuMTE0LTIuMy4xNi0xLjc3Ni0yLjczNy0xLjMyNS02LjA4NC0xLjQtMy4xMy0uMDczLTcuMS0xLjEzNS03LjIzNC0zLjAyOC0uMTQ2LTIuMDM4LDMuMDU3LTEuMTk0LDYuMDg0LTEuMjUyLDMuMDU3LS4wNTgsNS45NTMtMS4wMzQsNS40MTUtMy4wNzEtLjI5MS0xLjEwNi0yLjExMS0uNDA4LTQuMzY3LS4zMDZzLTQuOTkzLS4zNzgtNS4xNjctMS4zMWMtLjMyLTEuNzQ3LDMuNzg0LTMuNDA2LDUuOTM5LTMuNjI1WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTEzODAuODI5IC00NDkuOSknIGZpbGw9JyUyM2M0M2Y1NycgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xMzc3LjM0OCw0NDkuOWMuMzM1LDAsLjY3LjAxNS45OS4wNDRoLS4yMzNhMTAuMjUsMTAuMjUsMCwwLDAtLjk5LDIwLjQ1MSwxMC4yNDksMTAuMjQ5LDAsMCwxLC4yMzMtMjAuNVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMzY3LjEgLTQ0OS45KScgZmlsbD0nJTIzZGY5OWZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQy9nJTNFJTNDZyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSg3Mi4yNzEgMzQuMzM4KSclM0UlM0NwYXRoIGQ9J000OTguNzI3LDI0MC4zNTRhMi4yMjcsMi4yMjcsMCwxLDAtMi4yMjctMi4yMjcsMi4yMzYsMi4yMzYsMCwwLDAsMi4yMjcsMi4yMjdaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNDk2LjUgLTIzNS45KScgZmlsbD0nJTIzN2MxMzcwJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTUwNS41ODksMjM4LjMxNWEyLjIyOCwyLjIyOCwwLDAsMS0xLjIyMyw0LjA5LDEuNTgyLDEuNTgyLDAsMCwxLS4yNjItLjAxNSwyLjIyOCwyLjIyOCwwLDAsMSwxLjIyMy00LjA5Yy4wODcsMCwuMTc1LjAxNS4yNjIuMDE1WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTUwMi4xMzkgLTIzNy45NTEpJyBmaWxsPSclMjNiZTIzODUnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDL2clM0UlM0NnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDExMi4wMjQgNTUuOTgzKSclM0UlM0NwYXRoIGQ9J003ODQuOTQyLDQxNS4yODRBMTUuMzQyLDE1LjM0MiwwLDEsMCw3NjkuNiwzOTkuOTQyYTE1LjM3MiwxNS4zNzIsMCwwLDAsMTUuMzQyLDE1LjM0MlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC03NjkuNiAtMzg0LjYpJyBmaWxsPSclMjM2ODM4YTQnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNODA0LjE2Nyw0MzEuMjM0QTEyLjA2NywxMi4wNjcsMCwxLDAsNzkyLjEsNDE5LjE2N2ExMi4wOTIsMTIuMDkyLDAsMCwwLDEyLjA2NywxMi4wNjdaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNzg4LjgyNSAtNDAzLjgyNSknIGZpbGw9JyUyMzc5NGRhZScgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J004MTkuNzE4LDQ0NC4xMzZhOS40MTgsOS40MTgsMCwxLDAtOS40MTgtOS40MTgsOS40MzMsOS40MzMsMCwwLDAsOS40MTgsOS40MThaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtODA0LjM3NiAtNDE5LjM3NiknIGZpbGw9JyUyMzllN2VjNScgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J004MjcuMTUxLDQ1MC4zQTguMTUxLDguMTUxLDAsMSwwLDgxOSw0NDIuMTUxYTguMTY2LDguMTY2LDAsMCwwLDguMTUxLDguMTUxWicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTgxMS44MDkgLTQyNi44MDkpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDL2clM0UlM0NnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDQ0LjEzNCAxMTQuMTIpJyUzRSUzQ3BhdGggZD0nTTMwMy45ODQsODg4LjE0N2EuNzU1Ljc1NSwwLDAsMSwuMzkzLjFjLjExNi4wNzMsMTMuOTc0LTcuNzczLDE0LjA0Ny03LjY1NnMtMTMuNjI1LDguMjEtMTMuNjI1LDguMzdhLjguOCwwLDEsMS0xLjYsMCwuNzkuNzksMCwwLDEsLjc4Ni0uODE1WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTMwMy4xOTcgLTg2Ni41MzEpJyBmaWxsPSclMjNmZmMnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMzA0LjkyNiw5MzQuOTUyYS42MjYuNjI2LDAsMSwwLDAtMS4yNTIuNjIxLjYyMSwwLDAsMC0uNjI2LjYyNi42MzEuNjMxLDAsMCwwLC42MjYuNjI2WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTMwNC4xMzkgLTkxMS45MDkpJyBmaWxsPSclMjNmZjYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMzA1LjgyMiw5MzYuMzQ0YS40MjIuNDIyLDAsMSwwLS40MjItLjQyMi40MjIuNDIyLDAsMCwwLC40MjIuNDIyWicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTMwNS4wNzkgLTkxMy40NDcpJyBmaWxsPSclMjNmYzAnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNNDI1Ljk0Myw3OTYuMzcyYy4wMjktLjAxNSwyMS4zNjgtMTIuNDE2LDIxLjQtMTIuMzczcy0yMS4yMDgsMTIuNTkxLTIxLjI1MiwxMi42MmMtLjI5MS4xNzUtLjQwOC0uMDg3LS4xNDYtLjI0N1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC00MDcuOTUxIC03ODMuOTk5KScgZmlsbD0nJTIzZmZjJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQy9nJTNFJTNDZyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSg3Ljc3MyA0LjA5KSclM0UlM0NwYXRoIGQ9J002NDEuODY0LDExMS4yMTNhLjM2LjM2LDAsMCwwLC4zNjQtLjM2NC4zNDguMzQ4LDAsMCwwLS4zNjQtLjM0OS4zNTcuMzU3LDAsMSwwLDAsLjcxM1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC01NTUuODk2IC05OC41MDYpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNNDgwLjU2NCw4MS42MjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM3LjM3LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTQxOC4wNzUgLTczLjIxNCknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J000MTYuMzY0LDI3OS4yMjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM3LjM3LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTM2My4yMiAtMjQyLjA1MSknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J001NTQuMDY0LDUzMC4wMjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM3LjM3LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTQ4MC44NzYgLTQ1Ni4zNDUpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNNDIxLjI2NCw2NTIuMjEzYS4zNTcuMzU3LDAsMCwwLC4zNjQtLjM0OS4zNy4zNywwLDAsMC0uMzY0LS4zNjQuMzU3LjM1NywwLDEsMCwwLC43MTNaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMzY3LjQwNiAtNTYwLjc1NyknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J000NzMuMTY0LDY2Mi4wMjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM3LjM3LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTQxMS43NTIgLTU2OS4xMzEpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNNjg3Ljk2NCw4NDcuMTI4YS4zNjQuMzY0LDAsMSwwLS4zNjQtLjM2NC4zNi4zNiwwLDAsMCwuMzY0LjM2NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC01OTUuMjg1IC03MjcuMjg3KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTYyMS4zNjQsODkxLjcxM2EuMzYuMzYsMCwwLDAsLjM2NC0uMzY0LjM0OC4zNDgsMCwwLDAtLjM2NC0uMzQ5LjM1Ny4zNTcsMCwxLDAsMCwuNzEzWicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTUzOC4zOCAtNzY1LjM5NSknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNzkuMjY0LDY4OS4xMjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM4LjM4LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTE2MC42MzIgLTU5Mi4yODYpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNNzk5LjE2NCw2NDIuMjI4YS4zNjQuMzY0LDAsMSwwLS4zNjQtLjM2NC4zNi4zNiwwLDAsMCwuMzY0LjM2NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC02OTAuMjk5IC01NTIuMjEzKScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTEwMjguNzY0LDc0NS45MjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM3LjM3LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTg4Ni40NzggLTY0MC44MTgpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTI0My42NjQsNTQzLjQyOGEuMzY0LjM2NCwwLDEsMC0uMzY0LS4zNjQuMzYuMzYsMCwwLDAsLjM2NC4zNjRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTA3MC4wOTcgLTQ2Ny43OTQpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTQwMS42NjQsMzQ4LjMyOGEuMzY0LjM2NCwwLDEsMC0uMzY0LS4zNjQuMzcuMzcsMCwwLDAsLjM2NC4zNjRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTIwNS4wOTggLTMwMS4wOTMpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTM2Mi4xNjQsMjU0LjUyOGEuMzY0LjM2NCwwLDEsMC0uMzY0LS4zNjQuMzYuMzYsMCwwLDAsLjM2NC4zNjRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTE3MS4zNDggLTIyMC45NDcpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTQ3My45NDQsMjAzLjYxM2EuMzU3LjM1NywwLDEsMCwwLS43MTMuMzQ4LjM0OCwwLDAsMC0uMzQ5LjM2NC4zMzYuMzM2LDAsMCwwLC4zNDkuMzQ5WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTEyNjYuODY5IC0xNzcuNDU2KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE1NTIuMzY0LDE5Ny43MjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM2LjM2LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTEzMzMuODYyIC0xNzIuNDE1KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE0NTMuMzY0LDE1Ny43MjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM1Mi4zNTIsMCwwLDAsLjM2NC4zNjRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTI0OS4yNzMgLTEzOC4yMzcpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTMwNS4zNjQsMzkuNzI4YS4zNjQuMzY0LDAsMSwwLS4zNjQtLjM2NC4zNy4zNywwLDAsMCwuMzY0LjM2NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMTIyLjgxNiAtMzcuNDEzKScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE2NzMuMzY0LDM5LjcyOGEuMzY0LjM2NCwwLDEsMC0uMzY0LS4zNjQuMzcuMzcsMCwwLDAsLjM2NC4zNjRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTQzNy4yNDkgLTM3LjQxMyknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNjYzLjQ2NCwyMjkuODI4YS4zNjQuMzY0LDAsMSwwLS4zNjQtLjM2NC4zNi4zNiwwLDAsMCwuMzY0LjM2NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xNDI4Ljc5IC0xOTkuODQyKScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE1MzkuOTY0LDQ3MS44MjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM2LjM2LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTEzMjMuMjY3IC00MDYuNjE2KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE2NTEuMDY0LDU3OC4wMjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM3LjM3LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTE0MTguMTk1IC00OTcuMzU4KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE1OTEuODY0LDc1My40MTNhLjM2LjM2LDAsMCwwLC4zNjQtLjM2NC4zNDguMzQ4LDAsMCwwLS4zNjQtLjM0OS4zNTcuMzU3LDAsMSwwLDAsLjcxM1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMzY3LjYxMiAtNjQ3LjIyNiknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xMjczLjI2NCw3MzguNTI4YS4zNjQuMzY0LDAsMSwwLS4zNjQtLjM2NC4zNi4zNiwwLDAsMCwuMzY0LjM2NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMDk1LjM4OCAtNjM0LjQ5NSknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xMTQyLjM2NCw4NTkuNTI4YS4zNjQuMzY0LDAsMSwwLS4zNjQtLjM2NC4zOC4zOCwwLDAsMCwuMzY0LjM2NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC05ODMuNTQyIC03MzcuODgyKScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTEwMjYuMzY0LDEyMy42MjhhLjM0OC4zNDgsMCwwLDAsLjM0OS0uMzY0LjM1Ny4zNTcsMCwxLDAtLjM0OS4zNjRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtODg0LjQyNyAtMTA5LjEwMSknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xMzIuMzY0LDUyLjAyOGEuMzQ4LjM0OCwwLDAsMCwuMzQ5LS4zNjQuMzU3LjM1NywwLDEsMC0uNzEzLDAsLjM3LjM3LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTEyMC41NTkgLTQ3LjkyMyknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNDUuMiw2Mi40OTRhLjU5LjU5LDAsMCwwLC42LS42LjYuNiwwLDAsMC0uNi0uNi42MDkuNjA5LDAsMCwwLS42LjYuNi42LDAsMCwwLC42LjZaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTMxLjMyNSAtNTYuNDY3KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTI3OS42LDI5LjI5NGEuNi42LDAsMCwwLC42LS42LjYwOS42MDksMCwwLDAtLjYtLjYuNi42LDAsMCwwLS42LjYuNTkuNTksMCwwLDAsLjYuNlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0yNDYuMTYxIC0yOC4xKScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTMyOSw3Ni4xOTRhLjYwOS42MDksMCwwLDAsLjYtLjYuNi42LDAsMCwwLS42LS42LjYuNiwwLDAsMCwwLDEuMTk0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTI4OC4zNzEgLTY4LjE3MyknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J002NDEuMyw1Mi43OTRhLjYuNiwwLDAsMCwuNi0uNi41OS41OSwwLDAsMC0uNi0uNi42LjYsMCwwLDAsMCwxLjE5NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC01NTUuMjEyIC00OC4xNzkpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMjY2LjQsMzc1LjM5NGEuNi42LDAsMCwwLC42LS42LjYwOS42MDksMCwwLDAtLjYtLjYuNi42LDAsMCwwLS42LjYuNTkuNTksMCwwLDAsLjYuNlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0yMzQuODgzIC0zMjMuODIxKScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTU3Mi42LDcxOC42OTRhLjYuNiwwLDAsMCwuNi0uNi42MDkuNjA5LDAsMCwwLS42LS42LjYuNiwwLDEsMCwwLDEuMTk0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTQ5Ni41MTIgLTYxNy4xNSknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J001NCw4NzYuNjk0YS42LjYsMCwxLDAsMC0xLjE5NC42MDkuNjA5LDAsMCwwLS42LjYuNi42LDAsMCwwLC42LjZaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNTMuNCAtNzUyLjE1MiknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xMDAyLjMsOTA4Ljc5NGEuNTkuNTksMCwwLDAsLjYtLjYuNi42LDAsMCwwLS42LS42LjYwOS42MDksMCwwLDAtLjYuNi41OS41OSwwLDAsMCwuNi42WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTg2My42NjQgLTc3OS41NzkpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTE5Mi45LDQ3NC4xOTRhLjYuNiwwLDAsMCwuNi0uNi41OS41OSwwLDAsMC0uNi0uNi42LjYsMCwxLDAsMCwxLjE5NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMDI2LjUyIC00MDguMjQpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTU4OC4xLDY3My40OTRhLjU5LjU5LDAsMCwwLC42LS42LjYuNiwwLDAsMC0uNi0uNi42MDkuNjA5LDAsMCwwLS42LjYuNi42LDAsMCwwLC42LjZaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTM2NC4xOTUgLTU3OC41MyknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J005MzUuNCwyMjAuMDk0YS42LjYsMCwwLDAsLjYtLjYuNTkuNTksMCwwLDAtLjYtLjYuNi42LDAsMCwwLS42LjYuNTkuNTksMCwwLDAsLjYuNlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC04MDYuNTAyIC0xOTEuMTI3KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE1ODIuNiw2My40OTRhLjYwOS42MDksMCwwLDAsLjYtLjYuNi42LDAsMSwwLTEuMTk0LDAsLjYwOS42MDksMCwwLDAsLjYuNlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMzU5LjQ5NSAtNTcuMzIyKScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTY3OS4yNDcsNDQ2Ljk5NWEuMjQ3LjI0NywwLDEsMC0uMjQ3LS4yNDcuMjQ1LjI0NSwwLDAsMCwuMjQ3LjI0N1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC01ODcuOTM3IC0zODUuNTk3KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTY3Ny41NDcsMTYwLjk5NWEuMjU1LjI1NSwwLDAsMCwuMjQ3LS4yNDcuMjQ1LjI0NSwwLDAsMC0uMjQ3LS4yNDcuMjQ3LjI0NywwLDEsMCwwLC40OTVaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNTg2LjQ4NCAtMTQxLjIyOCknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J005NjUuMjQ3LDY1LjU5NWEuMjU1LjI1NSwwLDAsMCwuMjQ3LS4yNDcuMjQ1LjI0NSwwLDAsMC0uMjQ3LS4yNDcuMjM3LjIzNywwLDAsMC0uMjQ3LjI0Ny4yNDUuMjQ1LDAsMCwwLC4yNDcuMjQ3WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTgzMi4zMDYgLTU5LjcxNCknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xMzE1Ljk0OCwyOTcuNjk1YS4yNDcuMjQ3LDAsMSwwLS4yNDctLjI0Ny4yMzcuMjM3LDAsMCwwLC4yNDcuMjQ3WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTExMzEuOTU4IC0yNTguMDI5KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE1NjUuMzQ4LDI5Ny42OTVhLjI1NS4yNTUsMCwwLDAsLjI0Ny0uMjQ3LjI0NS4yNDUsMCwwLDAtLjI0Ny0uMjQ3LjI1NS4yNTUsMCwwLDAtLjI0OC4yNDcuMjM3LjIzNywwLDAsMCwuMjQ4LjI0N1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMzQ1LjA1NSAtMjU4LjAyOSknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNjI3LjA0OCw1MTcuNDk1YS4yNDcuMjQ3LDAsMCwwLDAtLjQ5NS4yNDcuMjQ3LDAsMSwwLDAsLjQ5NVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMzk3Ljc3NCAtNDQ1LjgzNSknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xMDQxLjc0OCw1MzcuMjk1YS4yNDcuMjQ3LDAsMCwwLDAtLjQ5NS4yNDcuMjQ3LDAsMSwwLDAsLjQ5NVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC04OTcuNjcxIC00NjIuNzUzKScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTExMzguMTQ3LDcyOS44OTVhLjI0Ny4yNDcsMCwxLDAtLjI0Ny0uMjQ3LjI0NS4yNDUsMCwwLDAsLjI0Ny4yNDdaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtOTgwLjAzOSAtNjI3LjMxOCknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J000MjYuOTQ3LDQwNi4zOTVhLjI0Ny4yNDcsMCwxLDAsMC0uNDk1LjI1NS4yNTUsMCwwLDAtLjI0Ny4yNDcuMjQ1LjI0NSwwLDAsMCwuMjQ3LjI0N1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0zNzIuMzYyIC0zNTAuOTA3KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTI1Ni40NDcsMjEzLjE5NWEuMjQ3LjI0NywwLDEsMC0uMjQ3LS4yNDcuMjQ1LjI0NSwwLDAsMCwuMjQ3LjI0N1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0yMjYuNjggLTE4NS44MjkpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMjUxLjU0NywzMzcuMjk1YS4yNDcuMjQ3LDAsMSwwLS4yNDctLjI0Ny4yNTUuMjU1LDAsMCwwLC4yNDcuMjQ3WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTIyMi40OTMgLTI5MS44NjUpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTU3Ljc0Nyw1MTAuMDk1YS4yNDcuMjQ3LDAsMCwwLDAtLjQ5NS4yNDUuMjQ1LDAsMCwwLS4yNDcuMjQ3LjIzNy4yMzcsMCwwLDAsLjI0Ny4yNDdaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTQyLjM0NyAtNDM5LjUxMiknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00yMTQuMzQ3LDE3NS4xOTVhLjI0NS4yNDUsMCwwLDAsLjI0Ny0uMjQ3LjI0Ny4yNDcsMCwwLDAtLjQ5NSwwLC4yNDUuMjQ1LDAsMCwwLC4yNDcuMjQ3WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTE5MC43MDggLTE1My4zNjEpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMzcwLjE0LDMyMi40OTVhLjI1NS4yNTUsMCwwLDAsLjI0Ny0uMjQ3LjI0NS4yNDUsMCwwLDAtLjI0Ny0uMjQ3LjI1NS4yNTUsMCwwLDAtLjI0Ny4yNDcuMjM3LjIzNywwLDAsMCwuMjQ3LjI0N1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0zMjMuODIzIC0yNzkuMjIpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTkyLjY0Nyw4NzIuNjk1YS4yNDcuMjQ3LDAsMSwwLS4yNDctLjI0Ny4yNDUuMjQ1LDAsMCwwLC4yNDcuMjQ3WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTE3Mi4xNjcgLTc0OS4zMzIpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNNTQyLjk0OCw5MzcuMjk1YS4yNTUuMjU1LDAsMCwwLC4yNDctLjI0Ny4yNDUuMjQ1LDAsMCwwLS4yNDctLjI0Ny4yNTUuMjU1LDAsMCwwLS4yNDcuMjQ3LjI0NS4yNDUsMCwwLDAsLjI0Ny4yNDdaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNDcxLjQ3NyAtODA0LjUyOSknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNjkxLjI0OCw4ODEuOTk1YS4yNDcuMjQ3LDAsMSwwLS4yNDgtLjI0Ny4yNTUuMjU1LDAsMCwwLC4yNDguMjQ3WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTE0NTIuNjI5IC03NTcuMjc4KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTEzMzEuNDQ4LDY0NC4xOTVhLjI0Ny4yNDcsMCwwLDAsMC0uNDk1LjI0Ny4yNDcsMCwwLDAsMCwuNDk1WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTExNDUuMjAyIC01NTQuMDkzKScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQy9nJTNFJTNDL3N2ZyUzRVwiKTtcblx0Y3Vyc29yOiB1cmwoJ2RhdGE6aW1hZ2Uvc3ZnK3htbDt1dGY4LDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHdpZHRoPVwiNDBcIiBoZWlnaHQ9XCI0MFwiIHZpZXdCb3g9XCIwIDAgNDAgNDBcIj48ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTg0NCAtNTAwKVwiPjxnIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSg4NDQgLTUyMC4zNilcIj48cGF0aCBkPVwiTTE5NC43ODcsMTIxMi4yOWEyLjg1OCwyLjg1OCwwLDEsMCwyLjg1OCwyLjg1OCwyLjg2OSwyLjg2OSwwLDAsMC0yLjg1OC0yLjg1OFpcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTE3NC43OTIgLTE3NC43OTMpXCIgZmlsbD1cIiUyMzg2ODY4NlwiLz48cGF0aCBkPVwiTTIwOS40MTYsMTIyOC4zNWExLjQyOSwxLjQyOSwwLDEsMS0xLjQyNCwxLjQyNCwxLjQxOSwxLjQxOSwwLDAsMSwxLjQyNC0xLjQyNFpcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTE4OS40MjEgLTE4OS40MTkpXCIgZmlsbD1cIiUyM2ZmNjU1YlwiLz48ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoMCAxMDIwLjM2KVwiPjxwYXRoIGQ9XCJNMjE2LjAyNCwxMDIwLjM2djEyLjg1NWgxLjQyNFYxMDIwLjM2WlwiIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgtMTk2LjczNiAtMTAyMC4zNilcIiBmaWxsPVwiJTIzODY4Njg2XCIvPjxwYXRoIGQ9XCJNMjE2LjAyNCwxMzI0LjI2djEyLjg2NmgxLjQyNFYxMzI0LjI2WlwiIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgtMTk2LjczNiAtMTI5Ny4xMjYpXCIgZmlsbD1cIiUyMzg2ODY4NlwiLz48cGF0aCBkPVwiTTMwNC4wMTYsMTIzNi4yN3YxLjQzNGgxMi44NTV2LTEuNDM0WlwiIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgtMjc2Ljg3MSAtMTIxNi45OTIpXCIgZmlsbD1cIiUyMzg2ODY4NlwiLz48cGF0aCBkPVwiTTAsMTIzNi4yN3YxLjQzNEgxMi44NTV2LTEuNDM0WlwiIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgwIC0xMjE2Ljk5MilcIiBmaWxsPVwiJTIzODY4Njg2XCIvPjwvZz48ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoOC44NjEgMTAyOS4yMTYpXCI+PHBhdGggZD1cIk0yNDQuNSwxMTE5LjU0OGEuNzE0LjcxNCwwLDAsMC0uMTIsMS40MDksMTAsMTAsMCwwLDEsNy40LDcuMzkxLjcxNS43MTUsMCwwLDAsMS4zOTEtLjMzdjBhMTEuNDMxLDExLjQzMSwwLDAsMC04LjQ1NC04LjQ0My43MTguNzE4LDAsMCwwLS4yMTItLjAyM1pcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTIzMC45MTggLTExMTkuNTQ3KVwiIGZpbGw9XCIlMjM4Njg2ODZcIi8+PHBhdGggZD1cIk0xMDcuOTcxLDExMTkuNTg5YS43MjEuNzIxLDAsMCwwLS4xOS4wMjMsMTEuNDI4LDExLjQyOCwwLDAsMC04LjQ0LDguNDI3LjcxNC43MTQsMCwwLDAsMS4zNzkuMzY5YzAtLjAxLjAwNS0uMDIxLjAwOC0uMDMxYTEwLDEwLDAsMCwxLDcuMzg2LTcuMzc3LjcxNC43MTQsMCwwLDAtLjE0Mi0xLjQwOVpcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTk5LjMxIC0xMTE5LjU4NilcIiBmaWxsPVwiJTIzODY4Njg2XCIvPjxwYXRoIGQ9XCJNMjUyLjQwNywxMjY0LjMzOGEuNzE0LjcxNCwwLDAsMC0uNzEyLjU1NSwxMCwxMCwwLDAsMS03LjM4Niw3LjM4LjcxNC43MTQsMCwwLDAsLjI4MiwxLjRsLjA1My0uMDEzYTExLjQzLDExLjQzLDAsMCwwLDguNDQtOC40MjkuNzEzLjcxMywwLDAsMC0uNjc4LS44OTNaXCIgdHJhbnNmb3JtPVwidHJhbnNsYXRlKC0yMzAuODM1IC0xMjUxLjQxKVwiIGZpbGw9XCIlMjM4Njg2ODZcIi8+PHBhdGggZD1cIk05OS45MjQsMTI2NC4wNzdhLjcxNC43MTQsMCwwLDAtLjY1Ni44OSwxMS40MzEsMTEuNDMxLDAsMCwwLDguNDQsOC40NTQuNzE1LjcxNSwwLDAsMCwuMzM1LTEuMzloMGE5Ljk5NSw5Ljk5NSwwLDAsMS03LjM4Ni03LjQuNzE0LjcxNCwwLDAsMC0uNzM0LS41NThoMFpcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTk5LjI0NiAtMTI1MS4xNzIpXCIgZmlsbD1cIiUyMzg2ODY4NlwiLz48L2c+PGcgdHJhbnNmb3JtPVwidHJhbnNsYXRlKDIgMTAyMi4zNilcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cIiUyMzcwNzA3MFwiIHN0cm9rZS13aWR0aD1cIjJcIj48Y2lyY2xlIGN4PVwiMThcIiBjeT1cIjE4XCIgcj1cIjE4XCIgc3Ryb2tlPVwibm9uZVwiLz48Y2lyY2xlIGN4PVwiMThcIiBjeT1cIjE4XCIgcj1cIjE3XCIgZmlsbD1cIm5vbmVcIi8+PC9nPjwvZz48L2c+PC9zdmc+JykgMTYgMTYsIGF1dG87XG59XG5cbi5hc3Rlcm9pZCB7XG5cdHdpZHRoOjQwcHg7XG5cdGhlaWdodDo0MHB4O1xuXHRiYWNrZ3JvdW5kLWltYWdlOiB1cmwoXCJkYXRhOmltYWdlL3N2Zyt4bWwsJTNDc3ZnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zycgd2lkdGg9JzYwJyBoZWlnaHQ9JzYwJyB2aWV3Qm94PScwIDAgNjAgNjAnJTNFJTNDZyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgwIDApJyUzRSUzQ3BhdGggZD0nTTIzMC45OTQsMTEuNzQyLDIyMS44NjcsMjIuNHYyQTE0LjY3MSwxNC42NzEsMCwwLDAsMjM2LjMsMTIuMzY2LDI1Ljc0MSwyNS43NDEsMCwwLDAsMjMwLjk5NCwxMS43NDJaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTk1Ljg2NyAtMTAuMzY2KScgZmlsbD0nJTIzNGE4ZGM2Jy8lM0UlM0NwYXRoIGQ9J00xNDYuMTc5LDExLjk4NGwuMDM1LS4yNjhhMzEuOTc2LDMxLjk3NiwwLDAsMC0yMC4zODEsNy40LDE0LjYzNSwxNC42MzUsMCwwLDAsMTEuMjU0LDUuMjYydi0yQzE0MS41NiwyMi4zNzUsMTQ1LjM4MywxOCwxNDYuMTc5LDExLjk4NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMTEuMDg4IC0xMC4zNCknIGZpbGw9JyUyMzc3YWFkNCcvJTNFJTNDcGF0aCBkPSdNMjQxLjA1OSwyNC4yMjFBMTAuNjYzLDEwLjY2MywwLDAsMCwyMzMuOSw3LjQ0MWEyMi4xNjcsMjIuMTY3LDAsMCwwLTguNDcyLTQuOTEzYy4wMTEtLjA1Ny4wMjItLjExNC4wMzMtLjE3MWEyLDIsMCwwLDAtMy45MzYtLjcxMywxMi42MjEsMTIuNjIxLDAsMCwxLTEuMzUzLDMuODJsLTEyLjgxLDUxLjg4NmExMC42NjMsMTAuNjYzLDAsMCwwLDE3LjE3OC00LjcxOSwzNS4xODgsMzUuMTg4LDAsMCwwLDQuNTc2LTMuMzM5LDQuNjY2LDQuNjY2LDAsMCwwLDUuMi01LjUwNkEzMS44LDMxLjgsMCwwLDAsMjQxLjA1OSwyNC4yMjFaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTgzLjA2NCAwKScgZmlsbD0nJTIzYTVjNmUzJy8lM0UlM0NwYXRoIGQ9J001My45MTQsNjcuOGMuNTI4LTYuMjU5LTEuMzcyLTExLjktNS4zNTEtMTUuODc1QTE4LjkxNywxOC45MTcsMCwwLDAsMzcuMTEsNDYuNjE5YTEyLjY3MiwxMi42NzIsMCwwLDEtMjAuODMsMi4wMjYsMiwyLDAsMSwwLTMuMDY4LDIuNTY3bC4wMTYuMDE5cS0uNjU3LjYtMS4yOTMsMS4yMjlhMzUuNzQ0LDM1Ljc0NCwwLDAsMC00LjE3Nyw1LjAxN0ExMi42NzIsMTIuNjcyLDAsMCwwLDIuMDEzLDc2LjAwOSwyMy4xLDIzLjEsMCwwLDAsOC42MDgsOTEuOTE2LDIzLjA2NCwyMy4wNjQsMCwwLDAsMjQuMyw5OC41MDVhNTEuNzM4LDUxLjczOCwwLDAsMCwyMC45MzYtMTIuNzhBMjkuMDcyLDI5LjA3MiwwLDAsMCw1My45MTQsNjcuOFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDAgLTQxLjE1NiknIGZpbGw9JyUyM2QyZTNmMScvJTNFJTNDcGF0aCBkPSdNMjY3LjM3OCwzNjQuMDg5djEzLjMzM2E2LjY2Nyw2LjY2NywwLDAsMCwwLTEzLjMzM1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0yMzYuMDQ1IC0zMjEuNDIzKScgZmlsbD0nJTIzNGE4ZGM2Jy8lM0UlM0NwYXRoIGQ9J00yMTkuODIxLDM3MC43NTZjMC0zLjY4Mi0xLjE5NC02LjY2Ny0yLjY2Ny02LjY2N2E2LjY2Nyw2LjY2NywwLDAsMCwwLDEzLjMzM0MyMTguNjI4LDM3Ny40MjIsMjE5LjgyMSwzNzQuNDM4LDIxOS44MjEsMzcwLjc1NlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xODUuODIxIC0zMjEuNDIzKScgZmlsbD0nJTIzNzdhYWQ0Jy8lM0UlM0NwYXRoIGQ9J000MjAuOTc4LDk2LjcxMXYxMy4zMzNhNi42NjcsNi42NjcsMCwwLDAsMC0xMy4zMzNaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMzcxLjY0NSAtODUuMzc4KScgZmlsbD0nJTIzNGE4ZGM2Jy8lM0UlM0NwYXRoIGQ9J00zNzMuNDIxLDEwMy4zNzhjMC0zLjY4Mi0xLjE5NC02LjY2Ny0yLjY2Ny02LjY2N2E2LjY2Nyw2LjY2NywwLDEsMCwwLDEzLjMzM0MzNzIuMjI4LDExMC4wNDQsMzczLjQyMSwxMDcuMDYsMzczLjQyMSwxMDMuMzc4WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTMyMS40MjEgLTg1LjM3OCknIGZpbGw9JyUyMzc3YWFkNCcvJTNFJTNDZyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxNS42NjcgMjUpJyUzRSUzQ2NpcmNsZSBjeD0nMScgY3k9JzEnIHI9JzEnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEzLjMzMyA0KScgZmlsbD0nJTIzYTVjNmUzJy8lM0UlM0NjaXJjbGUgY3g9JzEnIGN5PScxJyByPScxJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxNy4zMzMpJyBmaWxsPSclMjNhNWM2ZTMnLyUzRSUzQ2NpcmNsZSBjeD0nMScgY3k9JzEnIHI9JzEnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDI4IDEyLjY2NyknIGZpbGw9JyUyM2E1YzZlMycvJTNFJTNDY2lyY2xlIGN4PScxJyBjeT0nMScgcj0nMScgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMCAyNC42NjcpJyBmaWxsPSclMjNhNWM2ZTMnLyUzRSUzQy9nJTNFJTNDcGF0aCBkPSdNMTA4LjA4OSwxNjQuOTc4djE3LjMzM2E4LjY2Nyw4LjY2NywwLDEsMCwwLTE3LjMzM1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC05NS40MjIgLTE0NS42NDUpJyBmaWxsPSclMjM0YThkYzYnLyUzRSUzQ3BhdGggZD0nTTQ3LjQ2NiwxNzMuNjQ0YzAtNC43ODYtMi4wODktOC42NjctNC42NjctOC42NjdhOC42NjcsOC42NjcsMCwxLDAsMCwxNy4zMzNDNDUuMzc3LDE4Mi4zMSw0Ny40NjYsMTc4LjQzLDQ3LjQ2NiwxNzMuNjQ0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTMwLjEzMyAtMTQ1LjY0NCknIGZpbGw9JyUyMzc3YWFkNCcvJTNFJTNDL2clM0UlM0Mvc3ZnJTNFXCIpO1xuXHRiYWNrZ3JvdW5kLXNpemU6Y29udGFpbjtcblx0YmFja2dyb3VuZC1yZXBlYXQ6bm8tcmVwZWF0O1xufVxuLnNwYWNlc2hpcCB7XG5cdHdpZHRoOjM2cHg7XG5cdGhlaWdodDo0NnB4O1xuXHRiYWNrZ3JvdW5kLWltYWdlOiB1cmwoXCJkYXRhOmltYWdlL3N2Zyt4bWwsJTNDc3ZnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zycgd2lkdGg9JzI2LjM0MicgaGVpZ2h0PSczNicgdmlld0JveD0nMCAwIDI2LjM0MiAzNiclM0UlM0NnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMjMuNTgzIDApJyUzRSUzQ3BhdGggZD0nTTEzNi43NTUsMTUwLjA2M2wtMTIuNTEyLDEwLjAxYTEuNzU2LDEuNzU2LDAsMCwwLS42NTksMS4zNzF2NC40MjRsMTMuMTcxLTIuNjM0LDEzLjE3MSwyLjYzNHYtNC40MjRhMS43NTYsMS43NTYsMCwwLDAtLjY1OS0xLjM3MVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0wLjAwMSAtMTM1LjEzNyknIGZpbGw9JyUyM2ZmNjQ2NCcvJTNFJTNDcGF0aCBkPSdNMjIwLjYxNiwzMTMuMTM4bC0xLjA0NC00LjE3N2gtNi42NGwtMS4wNDQsNC4xNzdhLjg3OC44NzgsMCwwLDAsLjg1MiwxLjA5MWg3LjAyNWEuODc4Ljg3OCwwLDAsMCwuODUyLTEuMDkxWicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTc5LjQ5OCAtMjc4LjIzKScgZmlsbD0nJTIzOTU5Y2IzJy8lM0UlM0NwYXRoIGQ9J00yMTQuNTIzLDMxMy4xMzhsMS4wNDQtNC4xNzdoLTIuNjM0bC0xLjA0NCw0LjE3N2EuODc4Ljg3OCwwLDAsMCwuODUyLDEuMDkxaDIuNjM0YS44NzguODc4LDAsMCwxLS44NTItMS4wOTFaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNzkuNDk4IC0yNzguMjMpJyBmaWxsPSclMjM3MDc0ODcnLyUzRSUzQ3BhdGggZD0nTTIwNy41NjkuNDI5LDIwMy40OCw3LjczNmEzLjUxMywzLjUxMywwLDAsMC0uNDQ3LDEuNzE1VjMwLjczMmExLjc1NiwxLjc1NiwwLDAsMCwxLjc1NiwxLjc1Nmg3LjAyNWExLjc1NiwxLjc1NiwwLDAsMCwxLjc1Ni0xLjc1NlY5LjQ1YTMuNTExLDMuNTExLDAsMCwwLS40NDctMS43MTVMMjA5LjAzNC40MjlBLjgzOS44MzksMCwwLDAsMjA3LjU2OS40MjlaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNzEuNTQ3IDApJyBmaWxsPSclMjNlNGVhZjYnLyUzRSUzQ3BhdGggZD0nTTIwNi41NDUsMzAuNzgxVjkuNWE3LjY1OCw3LjY1OCwwLDAsMSwuMTg2LTEuNzE1bDEuNy03LjMwN2ExLjExMSwxLjExMSwwLDAsMSwuMTU3LS4zNzEuODMzLjgzMywwLDAsMC0xLjAyMy4zNzFMMjAzLjQ4LDcuNzg1YTMuNTEzLDMuNTEzLDAsMCwwLS40NDcsMS43MTVWMzAuNzgxYTEuNzU2LDEuNzU2LDAsMCwwLDEuNzU2LDEuNzU2aDIuNDg4QzIwNi44NzMsMzIuNTM3LDIwNi41NDUsMzEuNzUxLDIwNi41NDUsMzAuNzgxWicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTcxLjU0NyAtMC4wNDkpJyBmaWxsPSclMjNjN2NmZTInLyUzRSUzQ3BhdGggZD0nTTIwOS4wMzUuNDNhLjgzOS44MzksMCwwLDAtMS40NjQsMGwtNC4wODksNy4zMDdhMy41MTMsMy41MTMsMCwwLDAtLjQ0NywxLjcxNXY0LjZoMTAuNTM3di00LjZhMy41MTEsMy41MTEsMCwwLDAtLjQ0Ny0xLjcxNVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC03MS41NDggLTAuMDAxKScgZmlsbD0nJTIzZmY2NDY0Jy8lM0UlM0NwYXRoIGQ9J00yMDYuNTQ2LDkuNTEyYTcuNjU4LDcuNjU4LDAsMCwxLC4xODYtMS43MTVsMS43LTcuMzA3YTEuMTExLDEuMTExLDAsMCwxLC4xNTctLjM3MS44Ni44NiwwLDAsMC0uNTUzLS4wMTJjLS4wMTMsMC0uMDI2LjAxMS0uMDM5LjAxNmEuODEyLjgxMiwwLDAsMC0uMTkzLjEwNmMtLjAxOS4wMTQtLjAzOC4wMjctLjA1Ni4wNDNhLjgyMS44MjEsMCwwLDAtLjE4Mi4yMThMMjAzLjQ4MSw3LjhhMy41MTMsMy41MTMsMCwwLDAtLjQ0NywxLjcxNXY0LjZoMy41MTJaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNzEuNTQ4IC0wLjA2MSknIGZpbGw9JyUyM2QyNTU1YScvJTNFJTNDcGF0aCBkPSdNMjEzLjU3MSwxNDEuMjM1SDIwMy4wMzR2MS43NTZoMi4yNTJhMy40NjksMy40NjksMCwwLDAsNi4wMzQsMGgyLjI1MnYtMS43NTZaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNzEuNTQ4IC0xMjcuMTg3KScgZmlsbD0nJTIzYzdjZmUyJy8lM0UlM0NjaXJjbGUgY3g9JzEuNzU2JyBjeT0nMS43NTYnIHI9JzEuNzU2JyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMzQuOTk5IDEyLjI5MiknIGZpbGw9JyUyMzViNWQ2ZScvJTNFJTNDcGF0aCBkPSdNMjA2LjU0NiwxNDQuMjY2di0zLjAzMmgtMy41MTJ2MS43NTZoMi4yNTJBMy41NTEsMy41NTEsMCwwLDAsMjA2LjU0NiwxNDQuMjY2WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTcxLjU0OCAtMTI3LjE4NiknIGZpbGw9JyUyM2FmYjlkMicvJTNFJTNDcGF0aCBkPSdNMjE5LjY3Ny40MjlsLTMuMiw1LjcxNmg3Ljg2M2wtMy4yLTUuNzE2QS44MzkuODM5LDAsMCwwLDIxOS42NzcuNDI5WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTgzLjY1NSAwKScgZmlsbD0nJTIzNzA3NDg3Jy8lM0UlM0NwYXRoIGQ9J00yMTkuMjExLDYuMjA2LDIyMC41NDQuNDg5QTEuMTExLDEuMTExLDAsMCwxLDIyMC43LjExOGEuODYuODYsMCwwLDAtLjU1My0uMDEybC0uMDExLDAtLjAyOC4wMTFhLjgxMi44MTIsMCwwLDAtLjE5My4xMDZsLS4wMi4wMTVjLS4wMTIuMDA5LS4wMjUuMDE4LS4wMzcuMDI4YS44MjMuODIzLDAsMCwwLS4xODIuMjE4bC0zLjIsNS43MTZoMi43MzJaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtODMuNjU2IC0wLjA2KScgZmlsbD0nJTIzNWI1ZDZlJy8lM0UlM0NnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEyMy41ODMgMjUuNDYzKSclM0UlM0NwYXRoIGQ9J00xMjMuNTg0LDI2MS4yNjRsNy45LTEuNTgxVjI1NmwtNy45LDIuMTA3WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTEyMy41ODQgLTI1NS45OTYpJyBmaWxsPSclMjNkMjU1NWEnLyUzRSUzQ3BhdGggZD0nTTMxNi44NywyNjEuMjY0bC03LjktMS41ODFWMjU2bDcuOSwyLjEwN1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0yOTAuNTI3IC0yNTUuOTk2KScgZmlsbD0nJTIzZDI1NTVhJy8lM0UlM0MvZyUzRSUzQ2cgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTIzLjU4MyAyNS40NjMpJyUzRSUzQ3BhdGggZD0nTTEyNC40NjIsMjY0LjgyNGgwYS44NzguODc4LDAsMCwwLS44NzguODc4djcuMDI1YS44NzguODc4LDAsMCwwLC44NzguODc4aDBhLjg3OC44NzgsMCwwLDAsLjg3OC0uODc4VjI2NS43QS44NzguODc4LDAsMCwwLDEyNC40NjIsMjY0LjgyNFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMjMuNTg0IC0yNjMuOTQ2KScgZmlsbD0nJTIzYWZiOWQyJy8lM0UlM0NwYXRoIGQ9J00xNTkuNzczLDI1NmgwYS44NzguODc4LDAsMCwwLS44NzguODc4djQuMzlhLjg3OC44NzgsMCwwLDAsLjg3OC44NzhoMGEuODc4Ljg3OCwwLDAsMCwuODc4LS44Nzh2LTQuMzlBLjg3OC44NzgsMCwwLDAsMTU5Ljc3MywyNTZaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTU1LjM4MyAtMjU1Ljk5NiknIGZpbGw9JyUyM2FmYjlkMicvJTNFJTNDcGF0aCBkPSdNMzcxLjYzOSwyNjQuODI0aDBhLjg3OC44NzgsMCwwLDEsLjg3OC44Nzh2Ny4wMjVhLjg3OC44NzgsMCwwLDEtLjg3OC44NzhoMGEuODc4Ljg3OCwwLDAsMS0uODc4LS44NzhWMjY1LjdBLjg3OC44NzgsMCwwLDEsMzcxLjYzOSwyNjQuODI0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTM0Ni4xNzUgLTI2My45NDYpJyBmaWxsPSclMjNhZmI5ZDInLyUzRSUzQ3BhdGggZD0nTTMzNi4zMjgsMjU2aDBhLjg3OC44NzgsMCwwLDEsLjg3OC44Nzh2NC4zOWEuODc4Ljg3OCwwLDAsMS0uODc4Ljg3OGgwYS44NzguODc4LDAsMCwxLS44NzgtLjg3OHYtNC4zOUEuODc4Ljg3OCwwLDAsMSwzMzYuMzI4LDI1NlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0zMTQuMzc2IC0yNTUuOTk2KScgZmlsbD0nJTIzYWZiOWQyJy8lM0UlM0MvZyUzRSUzQ2cgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTIzLjU4MyAyNS40NDYpJyUzRSUzQ2NpcmNsZSBjeD0nMC44OTUnIGN5PScwLjg5NScgcj0nMC44OTUnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDAgMC44NjIpJyBmaWxsPSclMjM5NTljYjMnLyUzRSUzQ2NpcmNsZSBjeD0nMC44OTUnIGN5PScwLjg5NScgcj0nMC44OTUnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDMuNDk2KScgZmlsbD0nJTIzOTU5Y2IzJy8lM0UlM0NjaXJjbGUgY3g9JzAuODk1JyBjeT0nMC44OTUnIHI9JzAuODk1JyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgyNC41NTIgMC44NjIpJyBmaWxsPSclMjM5NTljYjMnLyUzRSUzQ2NpcmNsZSBjeD0nMC44OTUnIGN5PScwLjg5NScgcj0nMC44OTUnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDIxLjA1NyknIGZpbGw9JyUyMzk1OWNiMycvJTNFJTNDL2clM0UlM0NnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEzNS44NzYgMjMuNzA3KSclM0UlM0NwYXRoIGQ9J00yNDguMDUsMjQzLjYwOGgwYS44NzguODc4LDAsMCwwLC44NzgtLjg3OHYtMy41MTJhLjg3OC44NzgsMCwwLDAtLjg3OC0uODc4aDBhLjg3OC44NzgsMCwwLDAtLjg3OC44Nzh2My41MTJBLjg3OC44NzgsMCwwLDAsMjQ4LjA1LDI0My42MDhaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMjQ3LjE3MiAtMjM4LjM0KScgZmlsbD0nJTIzYzdjZmUyJy8lM0UlM0NwYXRoIGQ9J00yNzQuNTM0LDI0My42MDhoMGEuODc4Ljg3OCwwLDAsMCwuODc4LS44Nzh2LTMuNTEyYS44NzguODc4LDAsMCwwLS44NzgtLjg3OGgwYS44NzguODc4LDAsMCwwLS44NzguODc4djMuNTEyQS44NzguODc4LDAsMCwwLDI3NC41MzQsMjQzLjYwOFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0yNzEuMDIyIC0yMzguMzQpJyBmaWxsPSclMjNjN2NmZTInLyUzRSUzQy9nJTNFJTNDcGF0aCBkPSdNMjIxLjU2NywyNDMuNjA4aDBhLjg3OC44NzgsMCwwLDAsLjg3OC0uODc4di0zLjUxMmEuODc4Ljg3OCwwLDAsMC0uODc4LS44NzhoMGEuODc4Ljg3OCwwLDAsMC0uODc4Ljg3OHYzLjUxMkEuODc4Ljg3OCwwLDAsMCwyMjEuNTY3LDI0My42MDhaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtODcuNDQ3IC0yMTQuNjMzKScgZmlsbD0nJTIzYWZiOWQyJy8lM0UlM0MvZyUzRSUzQy9zdmclM0VcIik7XG5cdGJhY2tncm91bmQtc2l6ZTpjb250YWluO1xuXHRiYWNrZ3JvdW5kLXJlcGVhdDpuby1yZXBlYXQ7XG59XG5cbi5hc3Rlcm9pZC5hY3RpdmUge1xuXHR3aWR0aDo2MHB4O1xuXHRoZWlnaHQ6NjBweDtcblx0YmFja2dyb3VuZC1pbWFnZTogdXJsKFwiZGF0YTppbWFnZS9zdmcreG1sLCUzQ3N2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc2NScgaGVpZ2h0PSc2NCcgdmlld0JveD0nMCAwIDY1IDY0JyUzRSUzQ2cgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTEwMDMgLTQ5MCknJTNFJTNDY2lyY2xlIGN4PScyMy41JyBjeT0nMjMuNScgcj0nMjMuNScgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTAwOSA1MDIpJyBmaWxsPSclMjNkMmUzZjEnLyUzRSUzQ2NpcmNsZSBjeD0nOScgY3k9JzknIHI9JzknIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEwMDkgNTAyKScgZmlsbD0nJTIzZDJlM2YxJy8lM0UlM0NjaXJjbGUgY3g9JzEyJyBjeT0nMTInIHI9JzEyJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMDIxIDQ5MCknIGZpbGw9JyUyM2QyZTNmMScvJTNFJTNDY2lyY2xlIGN4PScxMicgY3k9JzEyJyByPScxMicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTAzMyA0OTkpJyBmaWxsPSclMjNkMmUzZjEnLyUzRSUzQ2NpcmNsZSBjeD0nMTInIGN5PScxMicgcj0nMTInIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEwMDMgNTIwKScgZmlsbD0nJTIzZDJlM2YxJy8lM0UlM0NjaXJjbGUgY3g9JzEyJyBjeT0nMTInIHI9JzEyJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMDMzIDUzMCknIGZpbGw9JyUyM2QyZTNmMScvJTNFJTNDY2lyY2xlIGN4PSc3LjUnIGN5PSc3LjUnIHI9JzcuNScgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTA0OCA1MjMpJyBmaWxsPSclMjNkMmUzZjEnLyUzRSUzQ2NpcmNsZSBjeD0nNy41JyBjeT0nNy41JyByPSc3LjUnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEwMTAgNTIzKScgZmlsbD0nJTIzNGE4ZGM2Jy8lM0UlM0NjaXJjbGUgY3g9JzcuNScgY3k9JzcuNScgcj0nNy41JyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMDE1IDUxNCknIGZpbGw9JyUyMzRhOGRjNicvJTNFJTNDY2lyY2xlIGN4PScxOCcgY3k9JzE4JyByPScxOCcgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTAxOCA1MDQpJyBmaWxsPSclMjM0YThkYzYnLyUzRSUzQ2NpcmNsZSBjeD0nNy41JyBjeT0nNy41JyByPSc3LjUnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEwMTAgNTIzKScgZmlsbD0nJTIzNGE4ZGM2Jy8lM0UlM0NjaXJjbGUgY3g9JzQuNScgY3k9JzQuNScgcj0nNC41JyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMDU5IDUxMyknIGZpbGw9JyUyM2QyZTNmMScvJTNFJTNDY2lyY2xlIGN4PSc3LjUnIGN5PSc3LjUnIHI9JzcuNScgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTAzNiA1MzMpJyBmaWxsPSclMjM0YThkYzYnLyUzRSUzQ2NpcmNsZSBjeD0nNy41JyBjeT0nNy41JyByPSc3LjUnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEwMjcgNDk5KScgZmlsbD0nJTIzNGE4ZGM2Jy8lM0UlM0NjaXJjbGUgY3g9JzcuNScgY3k9JzcuNScgcj0nNy41JyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMDIwIDUxOCknIGZpbGw9JyUyMzc3YWFkNCcvJTNFJTNDY2lyY2xlIGN4PSc3LjUnIGN5PSc3LjUnIHI9JzcuNScgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTAzMyA1MDcpJyBmaWxsPSclMjM3N2FhZDQnLyUzRSUzQ2NpcmNsZSBjeD0nNS41JyBjeT0nNS41JyByPSc1LjUnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEwMzcgNTI3KScgZmlsbD0nJTIzNzdhYWQ0Jy8lM0UlM0NjaXJjbGUgY3g9JzQnIGN5PSc0JyByPSc0JyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMDM3IDUyNyknIGZpbGw9JyUyM2ZmZicvJTNFJTNDY2lyY2xlIGN4PSc0JyBjeT0nNCcgcj0nNCcgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTAyNiA1MjApJyBmaWxsPSclMjNmZmYnLyUzRSUzQ2NpcmNsZSBjeD0nNCcgY3k9JzQnIHI9JzQnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEwNDAgNTExKScgZmlsbD0nJTIzZmZmJy8lM0UlM0MvZyUzRSUzQy9zdmclM0VcIik7XG5cdGJhY2tncm91bmQtc2l6ZTpjb250YWluO1xuXHRiYWNrZ3JvdW5kLXJlcGVhdDpuby1yZXBlYXQ7XG59XG5cbi8qIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbk55WXk5amIyMXdiMjVsYm5SekwwcFRSVU5oY0hSamFHRXVjM1psYkhSbElsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN08wRkJSVUU3UTBGRFF5eHBRa0ZCYVVJN1EwRkRha0lzSzBOQlFTdERPME5CUXk5RExHbENRVUZwUWp0SlFVTmtMSEZDUVVGeFFqdEpRVU55UWl4blFrRkJaMEk3U1VGRGFFSXNaMEpCUVdkQ08wRkJRM0JDTzBGQlEwRTdTVUZEU1N4blFrRkJaMEk3U1VGRGFFSXNaMEpCUVdkQ08wbEJRMmhDTERKQ1FVRXlRanRKUVVNelFpeHBRa0ZCYVVJN1NVRkRha0lzYVVKQlFXbENPMGxCUTJwQ0xGZEJRVmM3U1VGRFdDeFhRVUZYTzBOQlEyUXNaMEpCUVdkQ08wTkJRMmhDTEhkQ1FVRjNRanREUVVONFFpeGpRVUZqTzBOQlEyUXNhMEpCUVd0Q08wTkJRMnhDTEZWQlFWVTdRVUZEV0RzN1FVRkZRVHRKUVVOSkxGZEJRVmM3U1VGRFdDeFhRVUZYTzBsQlExZ3NZVUZCWVR0QlFVTnFRanRCUVVOQk8wTkJRME1zV1VGQldUdEJRVU5pTzBGQlEwRTdRMEZEUXl4TlFVRk5PME5CUTA0c1owSkJRV2RDTzBOQlEyaENMSGRDUVVGM1FqdERRVU40UWl4alFVRmpPME5CUTJRc2EwSkJRV3RDTzBOQlEyeENMRlZCUVZVN1FVRkRXRHRCUVVOQk96dEZRVVZGTzBGQlEwWTdRMEZEUXl4blFrRkJaMEk3UTBGRGFFSXNXVUZCV1R0QlFVTmlPenRCUVVWQk8wTkJRME1zSzBOQlFTdERPMEZCUTJoRU96czdRVUZIUVN4TFFVRkxPenM3UVVGSFREczdSVUZGUlR0QlFVTkdPME5CUTBNc2EwSkJRV3RDTzBOQlEyeENMR1ZCUVdVN1FVRkRhRUk3TzBGQlJVRTdRMEZEUXl4WlFVRlpPME5CUTFvc1pVRkJaVHREUVVObUxHVkJRV1U3UTBGRFppeDVRa0ZCZVVJN1EwRkRla0lzV1VGQldUdERRVU5hTEZkQlFWYzdRVUZEV2pzN1FVRkZRVHREUVVORExGZEJRVmM3U1VGRFVpeFpRVUZaTzBOQlEyWXNPRUpCUVRoQ08wRkJReTlDT3p0QlFVVkJPME5CUTBNc1YwRkJWenRCUVVOYU96dEJRVVZCTzBOQlEwTXNLME5CUVN0RE8wRkJRMmhFTzBGQlEwRTdRMEZEUXl4alFVRmpPMEZCUTJZN1FVRkRRU3hMUVVGTE96dEJRVVZNT3p0RlFVVkZPMEZCUTBZN1EwRkRReXhyUWtGQmEwSTdRMEZEYkVJc1pVRkJaVHRCUVVOb1FqczdRVUZGUVR0RFFVTkRMRmxCUVZrN1EwRkRXaXhsUVVGbE8wTkJRMllzWlVGQlpUdERRVU5tTEhsQ1FVRjVRanREUVVONlFpeFhRVUZYTzBGQlExbzdPMEZCUlVFN1EwRkRReXhYUVVGWE8wTkJRMWdzT0VKQlFUaENPME5CUXpsQ0xGZEJRVmM3UVVGRFdqczdRVUZGUVR0RFFVTkRMRmRCUVZjN1FVRkRXanM3UVVGRlFUdERRVU5ETEN0RFFVRXJRenRCUVVOb1JEdEJRVU5CTzBOQlEwTXNZMEZCWXp0QlFVTm1PMEZCUTBFc1MwRkJTenM3UVVGRlREczdSVUZGUlR0QlFVTkdMR2RDUVVGblFqczdRVUZGYUVJN1EwRkRReXhqUVVGak8wRkJRMlk3UVVGRFFUdERRVU5ETzBGQlEwUTdRVUZEUVN4TFFVRkxPenM3UVVGSFREczdSVUZGUlR0QlFVTkdPME5CUTBNc1dVRkJXVHRCUVVOaU8wRkJRMEU3UTBGRFF5eFpRVUZaTzBOQlExb3NiVUpCUVcxQ08wTkJRMjVDTEd0Q1FVRnJRanREUVVOc1FpeFhRVUZYTzBOQlExZ3NZVUZCWVR0RFFVTmlMR2RDUVVGblFqdERRVU5vUWl4blFrRkJaMEk3UTBGRGFFSXNZMEZCWXp0RFFVTmtMR1ZCUVdVN1EwRkRaaXh4UTBGQmNVTTdRVUZEZEVNN08wRkJSVUU3UTBGRFF5eDVRa0ZCYVVJN1NVRkJha0lzYzBKQlFXbENPMHRCUVdwQ0xIRkNRVUZwUWp0VFFVRnFRaXhwUWtGQmFVSTdRVUZEYkVJN08wRkJSVUU3UTBGRFF5eG5Ra0ZCWjBJN1EwRkRhRUlzVjBGQlZ6dERRVU5ZTEdkQ1FVRm5RanREUVVOb1FpeHJRa0ZCYTBJN1EwRkRiRUlzSzBOQlFTdERPMEZCUTJoRU96dEJRVVZCTzBOQlEwTXNZVUZCWVR0RFFVTmlMR0ZCUVdFN1FVRkRaRHM3UVVGRlFUdERRVU5ETEZWQlFWVTdRMEZEVml4WFFVRlhPME5CUTFnc1dVRkJXVHREUVVOYUxGZEJRVmM3UTBGRFdDeHhRMEZCY1VNN1EwRkRja01zWjBKQlFXZENPMEZCUTJwQ096dEJRVVZCTzBOQlEwTXNhVU5CUVhsQ08xTkJRWHBDTEhsQ1FVRjVRanREUVVONlFpeG5RMEZCZDBJN1UwRkJlRUlzZDBKQlFYZENPME5CUTNoQ0xIRkRRVUUyUWp0VFFVRTNRaXcyUWtGQk5rSTdRMEZETjBJc05rSkJRWEZDTzFOQlFYSkNMSEZDUVVGeFFqdEJRVU4wUWpzN1FVRkZRVHREUVVORExIbENRVUY1UWp0RFFVTjZRaXhyUWtGQmEwSTdRMEZEYkVJc1dVRkJXVHREUVVOYUxHVkJRV1U3UTBGRFppeFpRVUZaTzBOQlExb3NaVUZCWlR0RFFVTm1MR1ZCUVdVN1EwRkRaaXhyUWtGQmEwSTdRMEZEYkVJc2EwSkJRV3RDTzBOQlEyeENMR2RDUVVGblFqdEJRVU5xUWpzN1FVRkZRVHREUVVORExHRkJRV0U3UVVGRFpEczdRVUZGUVR0RFFVTkRMR0ZCUVdFN1EwRkRZaXhWUVVGVk8wRkJRMWc3TzBGQlJVRTdRMEZEUXl4aFFVRmhPME5CUTJJc1ZVRkJWVHRCUVVOWU8wRkJRMEU3UTBGRFF5eGhRVUZoTzBOQlEySXNWVUZCVlR0QlFVTllPenRCUVVWQk8wTkJRME1zWVVGQllUdERRVU5pTEZWQlFWVTdRVUZEV0R0QlFVTkJPME5CUTBNc1dVRkJXVHREUVVOYUxGVkJRVlU3UTBGRFZpeGpRVUZqTzBOQlEyUXNkMEpCUVhkQ08wTkJRM2hDTERoQ1FVRTRRanRCUVVNdlFqczdRVUZGUVR0RFFVTkRMRmxCUVZrN1EwRkRXaXhWUVVGVk8wTkJRMVlzV1VGQldUdERRVU5hTERoQ1FVRTRRanRCUVVNdlFqczdPMEZCUjBFN1EwRkRReXhYUVVGWE8wTkJRMWdzVlVGQlZUdERRVU5XTEZsQlFWazdRMEZEV2l4WFFVRlhPenRCUVVWYU96dEJRVVZCT3p0RFFVVkRMRlZCUVZVN1EwRkRWaXh0UWtGQmJVSTdRMEZEYmtJc1lVRkJZVHREUVVOaUxIZENRVUYzUWp0RFFVTjRRaXhyUWtGQmEwSTdRMEZEYkVJc1QwRkJUenREUVVOUUxGRkJRVkU3UTBGRFVpeFZRVUZWTzBOQlExWXNVMEZCVXp0RFFVTlVMR1ZCUVdVN1FVRkRhRUk3UVVGRFFUdERRVU5ETEZOQlFWTTdRVUZEVmp0QlFVTkJPME5CUTBNc1lVRkJZVHRCUVVOa08wRkJRMEU3UTBGRFF5eFJRVUZSTzBOQlExSXNhMEpCUVd0Q08wTkJRMnhDTEU5QlFVODdRMEZEVUN4VlFVRlZPME5CUTFZc1UwRkJVenREUVVOVUxHVkJRV1U3UVVGRGFFSTdRVUZEUVR0RFFVTkRMR05CUVdNN1FVRkRaanRCUVVOQk8wTkJRME1zWTBGQll6dEJRVU5tT3p0QlFVVkJPME5CUTBNc1ZVRkJWVHRCUVVOWU96dEJRVVZCTzBOQlEwTXNhMEpCUVd0Q08wTkJRMnhDTEhkQ1FVRjNRanREUVVONFFpeFBRVUZQTzBGQlExSTdPMEZCUlVFN1EwRkRReXh6UWtGQmMwSTdRMEZEZEVJc2NVSkJRWEZDTzBOQlEzSkNMRmRCUVZjN1EwRkRXQ3huUWtGQlowSTdRVUZEYWtJN08wRkJSVUU3UTBGRFF5dzRRa0ZCT0VJN1EwRkRPVUlzYTBKQlFXdENPME5CUTJ4Q0xGZEJRVmM3UTBGRFdDeFhRVUZYTzBOQlExZ3NaMEpCUVdkQ08wTkJRMmhDTEd0Q1FVRnJRanRKUVVObUxHRkJRV0U3U1VGRFlpeDFRa0ZCZFVJN1NVRkRka0lzY1VKQlFYRkNPMEZCUTNwQ096dEJRVVZCTzBOQlEwTXNZVUZCWVR0RFFVTmlMRmRCUVZjN1FVRkRXanM3UVVGRlFUdERRVU5ETEcxQ1FVRnRRanREUVVOdVFpeHJRa0ZCYTBJN1EwRkRiRUlzV1VGQldUdERRVU5hTEdsQ1FVRnBRanREUVVOcVFpeGxRVUZsTzBGQlEyaENPMEZCUTBFN1EwRkRReXhYUVVGWE8wRkJRMW83T3p0QlFVZEJPME5CUTBNN1JVRkRReXhWUVVGVk8wVkJRMVlzVTBGQlV6dEZRVU5VTEZsQlFWazdSVUZEV2l3MlFrRkJOa0k3UTBGRE9VSTdPME5CUlVFN1JVRkRReXhWUVVGVk8wVkJRMVlzWVVGQllUdEZRVU5pTEZsQlFWazdSVUZEV2l3MlFrRkJOa0k3UlVGRE4wSXNaME5CUVdkRE8wTkJRMnBETzBGQlEwUTdPenRCUVdaQk8wTkJRME03UlVGRFF5eFZRVUZWTzBWQlExWXNVMEZCVXp0RlFVTlVMRmxCUVZrN1JVRkRXaXcyUWtGQk5rSTdRMEZET1VJN08wTkJSVUU3UlVGRFF5eFZRVUZWTzBWQlExWXNZVUZCWVR0RlFVTmlMRmxCUVZrN1JVRkRXaXcyUWtGQk5rSTdSVUZETjBJc1owTkJRV2RETzBOQlEycERPMEZCUTBRN08wRkJSVUU3UTBGRFF5eHRRa0ZCYlVJN1FVRkRjRUk3TzBGQlJVRTdPME5CUlVNc2VVSkJRWGxDTzBGQlF6RkNPenRCUVVWQk8wTkJRME1zZVVKQlFYbENPMEZCUXpGQ08wRkJRMEU3UTBGRFF5dzRRa0ZCT0VJN1FVRkRMMEk3UVVGRFFUdERRVU5ETEhkQ1FVRjNRanRCUVVONlFqczdRVUZGUVR0RFFVTkRPMkZCUTFrN1FVRkRZanRCUVVOQk8wTkJRME1zWVVGQllUdEJRVU5rTzBGQlEwRXNTMEZCU3pzN08wRkJSMHc3UTBGRFF5eHBRa0ZCYVVJN1EwRkRha0lzVTBGQlV6dERRVU5VTEhkQ1FVRjNRanRCUVVONlFqczdRVUZGUVR0RFFVTkRMRk5CUVZNN1FVRkRWanM3TzBGQlIwRTdRMEZEUXl4WFFVRlhPME5CUTFnc2NVSkJRWEZDTzBOQlEzSkNMREpDUVVFeVFqdERRVU16UWl3d2FXUkJRVEJwWkR0RFFVTXhhV1FzSzJsRlFVRXJhVVU3UVVGRGFHcEZPenRCUVVWQk8wTkJRME1zVlVGQlZUdERRVU5XTEZkQlFWYzdRMEZEV0N4emJrWkJRWE51Ump0RFFVTjBia1lzZFVKQlFYVkNPME5CUTNaQ0xESkNRVUV5UWp0QlFVTTFRanRCUVVOQk8wTkJRME1zVlVGQlZUdERRVU5XTEZkQlFWYzdRMEZEV0N4eE1FcEJRWEV3U2p0RFFVTnlNRW9zZFVKQlFYVkNPME5CUTNaQ0xESkNRVUV5UWp0QlFVTTFRanM3UVVGRlFUdERRVU5ETEZWQlFWVTdRMEZEVml4WFFVRlhPME5CUTFnc2FUTkVRVUZwTTBRN1EwRkRhak5FTEhWQ1FVRjFRanREUVVOMlFpd3lRa0ZCTWtJN1FVRkROVUlpTENKbWFXeGxJam9pYzNKakwyTnZiWEJ2Ym1WdWRITXZTbE5GUTJGd2RHTm9ZUzV6ZG1Wc2RHVWlMQ0p6YjNWeVkyVnpRMjl1ZEdWdWRDSTZXeUpjYmx4dVpHd2dlMXh1WEhSbWIyNTBMV1poYldsc2VUcGhjbWxoYkR0Y2JseDBZbTk0TFhOb1lXUnZkem9nTUhCNElEQndlQ0F3Y0hnZ01uQjRJSEpuWW1Fb01Dd2dNQ3dnTUN3Z01DNHdOaWs3WEc1Y2RHSnZjbVJsY2kxeVlXUnBkWE02TkhCNE8xeHVJQ0FnSUcxaGNtZHBiam9nTWpCd2VDQXdjSGdnTWpCd2VEdGNiaUFnSUNCdGFXNHRkMmxrZEdnNklESXdNSEI0TzF4dUlDQWdJRzFoZUMxM2FXUjBhRG9nTXpFMGNIZzdYRzU5WEc1a2RDQjdYRzRnSUNBZ2JXRnlaMmx1TFhSdmNEb2dMVFp3ZUR0Y2JpQWdJQ0JpWVdOclozSnZkVzVrT2lBalptWm1PMXh1SUNBZ0lDOHFJR1JwYzNCc1lYazZJR2x1YkdsdVpTMWliRzlqYXpzZ0tpOWNiaUFnSUNCdFlYSm5hVzR0YkdWbWREb2dNVEJ3ZUR0Y2JpQWdJQ0J3WVdSa2FXNW5PaUF3Y0hnZ01UQndlRHRjYmlBZ0lDQm1iRzloZERvZ2JHVm1kRHRjYmlBZ0lDQmpiR1ZoY2pvZ1ltOTBhRHRjYmx4MFptOXVkQzEzWldsbmFIUTZZbTlzWkR0Y2JseDBkR1Y0ZEMxMGNtRnVjMlp2Y20wNmRYQndaWEpqWVhObE8xeHVYSFJtYjI1MExYTnBlbVU2TVRCd2VEdGNibHgwYkdWMGRHVnlMWE53WVdOcGJtYzZNWEI0TzF4dVhIUmpiMnh2Y2pvak5qWTJPMXh1ZlZ4dVhHNWtaQ0I3WEc0Z0lDQWdiV0Z5WjJsdU9pQXdjSGc3WEc0Z0lDQWdZMnhsWVhJNklHSnZkR2c3WEc0Z0lDQWdjR0ZrWkdsdVp6b2dNVEJ3ZUR0Y2JuMWNiaU5LVTBVdFJFVkNWVWNnZTF4dVhIUmthWE53YkdGNU9tWnNaWGc3WEc1OVhHNGpTbE5GTFVSRlFsVkhJRDRnWkdsMklIdGNibHgwWm14bGVEb3hPMXh1WEhSbWIyNTBMWGRsYVdkb2REcGliMnhrTzF4dVhIUjBaWGgwTFhSeVlXNXpabTl5YlRwMWNIQmxjbU5oYzJVN1hHNWNkR1p2Ym5RdGMybDZaVG94TVhCNE8xeHVYSFJzWlhSMFpYSXRjM0JoWTJsdVp6b3hjSGc3WEc1Y2RHTnZiRzl5T2lNMk5qWTdYRzU5WEc0dktpcGNiaW9nUmt4QlZGeHVLaW92WEc0alNsTkZMVU5oY0hSamFHRXVabXhoZENCN1hHNWNkR0poWTJ0bmNtOTFibVE2SUc1dmJtVTdYRzVjZEhCaFpHUnBibWM2SURCd2VEdGNibjFjYmx4dUkwcFRSUzFEWVhCMFkyaGhMbVpzWVhRZ1pHVjBZV2xzY3lCN1hHNWNkR0p2ZUMxemFHRmtiM2M2SURCd2VDQXdjSGdnTUhCNElEUndlQ0J5WjJKaEtEQXNJREFzSURBc0lEQXVNRFlwTzF4dWZWeHVYRzVjYmk4cUtpb3FMMXh1WEc1Y2JpOHFLbHh1S2lCVFRVRk1URnh1S2lvdlhHNGpTbE5GTFVOaGNIUmphR0V1VXlCN1hHNWNkR0p2Y21SbGNpMXlZV1JwZFhNNklEWndlRHRjYmx4MFptOXVkQzF6YVhwbE9pQXhNWEI0TzF4dWZWeHVYRzRqU2xORkxVTmhjSFJqYUdFdVV5QWpTbE5GTFdsdWNIVjBJSHRjYmx4MGFHVnBaMmgwT2lBeU1IQjRPMXh1WEhSdGFXNHRkMmxrZEdnNklESXdjSGc3WEc1Y2RHWnZiblF0YzJsNlpUb2dNVFZ3ZUR0Y2JseDBZbTl5WkdWeU9pQnpiMnhwWkNBeGNIZ2dJMFF6UkRoRVJEdGNibHgwY0dGa1pHbHVaem9nTVhCNE8xeHVYSFJ0WVhKbmFXNDZJRFp3ZUR0Y2JuMWNibHh1STBwVFJTMURZWEIwWTJoaExsTWdJMHBUUlMxaWNtRnVaQ0I3WEc1Y2RIZHBaSFJvT2lBek1IQjRPMXh1SUNBZ0lHaGxhV2RvZERvZ016aHdlRHRjYmx4MFltOXlaR1Z5TFd4bFpuUTZJSE52Ykdsa0lESndlQ0FqUmpsR09VWTVPMXh1ZlZ4dVhHNGpTbE5GTFVOaGNIUmphR0V1VXlBalNsTkZMV0p5WVc1a0lITjJaeUI3WEc1Y2RIZHBaSFJvT2lBeU5IQjRPMXh1ZlZ4dVhHNGpTbE5GTFVOaGNIUmphR0V1VXk1bWJHRjBJR1JsZEdGcGJITWdlMXh1WEhSaWIzZ3RjMmhoWkc5M09pQXdjSGdnTUhCNElEQndlQ0F5Y0hnZ2NtZGlZU2d3TENBd0xDQXdMQ0F3TGpBMktUdGNibjFjYmlOS1UwVXRRMkZ3ZEdOb1lTNVRMbk4xWTJObGMzTWdJMHBUUlMxcGJuQjFkQ0I3WEc1Y2RHMXBiaTEzYVdSMGFEbzFNbkI0TzF4dWZWeHVMeW9xS2lvdlhHNWNiaThxS2x4dUtpQk5SVVJKVlUxY2Jpb3FMMXh1STBwVFJTMURZWEIwWTJoaExrMGdlMXh1WEhSaWIzSmtaWEl0Y21Ga2FYVnpPaUEyY0hnN1hHNWNkR1p2Ym5RdGMybDZaVG9nTVRad2VEdGNibjFjYmx4dUkwcFRSUzFEWVhCMFkyaGhMazBnSTBwVFJTMXBibkIxZENCN1hHNWNkR2hsYVdkb2REb2dNekJ3ZUR0Y2JseDBiV2x1TFhkcFpIUm9PaUF6TUhCNE8xeHVYSFJtYjI1MExYTnBlbVU2SURJd2NIZzdYRzVjZEdKdmNtUmxjam9nYzI5c2FXUWdNbkI0SUNORU0wUTRSRVE3WEc1Y2RHMWhjbWRwYmpvZ09IQjRPMXh1ZlZ4dVhHNGpTbE5GTFVOaGNIUmphR0V1VFNBalNsTkZMV0p5WVc1a0lIdGNibHgwZDJsa2RHZzZJRE00Y0hnN1hHNWNkR0p2Y21SbGNpMXNaV1owT2lCemIyeHBaQ0F5Y0hnZ0kwWTVSamxHT1R0Y2JseDBhR1ZwWjJoME9qVXdjSGc3WEc1OVhHNWNiaU5LVTBVdFEyRndkR05vWVM1TklDTktVMFV0WW5KaGJtUWdjM1puSUh0Y2JseDBkMmxrZEdnNklETTBjSGc3WEc1OVhHNWNiaU5LVTBVdFEyRndkR05vWVM1TkxtWnNZWFFnWkdWMFlXbHNjeUI3WEc1Y2RHSnZlQzF6YUdGa2IzYzZJREJ3ZUNBd2NIZ2dNSEI0SURKd2VDQnlaMkpoS0RBc0lEQXNJREFzSURBdU1EWXBPMXh1ZlZ4dUkwcFRSUzFEWVhCMFkyaGhMazB1YzNWalkyVnpjeUFqU2xORkxXbHVjSFYwSUh0Y2JseDBiV2x1TFhkcFpIUm9PamN3Y0hnN1hHNTlYRzR2S2lvcUtpOWNibHh1THlvcVhHNHFJRXhCVWtkRlhHNHFLaTljYmlOS1UwVXRRMkZ3ZEdOb1lTNU1JSHQ5WEc1Y2JpTktVMFV0UTJGd2RHTm9ZUzV6ZFdOalpYTnpJQ05LVTBVdGFXNXdkWFFnZTF4dVhIUnRhVzR0ZDJsa2RHZzZPVEp3ZUR0Y2JuMWNiaU5LVTBVdFEyRndkR05vWVNBalNsTkZMV0p5WVc1a0lIdGNibHgwYUdWcFoyaDBPalk0Y0hoY2JuMWNiaThxS2lvcUwxeHVYRzVjYmk4cUtseHVLaUJDUVZORlhHNHFLaTljYmlOallYQjBZMmhoUTJobFkyc2dleUJjYmx4MFpHbHpjR3hoZVRwdWIyNWxPMXh1ZlZ4dUkwcFRSUzFEWVhCMFkyaGhJSHRjYmx4MFpHbHpjR3hoZVRwdWIyNWxPMXh1WEhSaVlXTnJaM0p2ZFc1a09pQWpSakpHT0VaR08xeHVYSFJpYjNKa1pYSXRjbUZrYVhWek9pQTJjSGc3WEc1Y2RHTnNaV0Z5T2lCaWIzUm9PMXh1WEhSd1lXUmthVzVuT2lBeE0zQjRPMXh1WEhSdGFXNHRkMmxrZEdnNklESXdNSEI0TzF4dVhIUnRZWGd0ZDJsa2RHZzZJRE14TkhCNE8xeHVYSFJqYjJ4dmNqb2dJemN3TnpBM01EdGNibHgwWm05dWRDMXphWHBsT2lBeU1IQjRPMXh1WEhSbWIyNTBMV1poYldsc2VUb2dKMDF2Ym5SelpYSnlZWFFuTENCellXNXpMWE5sY21sbU8xeHVmVnh1WEc0alNsTkZMVU5oY0hSamFHRWdLaUI3WEc1Y2RIVnpaWEl0YzJWc1pXTjBPaUJ1YjI1bE8xeHVmVnh1WEc0alNsTkZMVU5oY0hSamFHRWdaR1YwWVdsc2N5QjdYRzVjZEc5MlpYSm1iRzkzT2lCb2FXUmtaVzQ3WEc1Y2RHMWhjbWRwYmpvZ01IQjRPMXh1WEhSaVlXTnJaM0p2ZFc1a09pQWpabVptTzF4dVhIUmliM0prWlhJdGNtRmthWFZ6T2lBMGNIZzdYRzVjZEdKdmVDMXphR0ZrYjNjNklEQndlQ0F6Y0hnZ05uQjRJREJ3ZUNCeVoySmhLREFzSURBc0lEQXNJREF1TVRJcE8xeHVmVnh1WEc0alNsTkZMVU5oY0hSamFHRWdaR1YwWVdsc2N5QnpkVzF0WVhKNUlIdGNibHgwWkdsemNHeGhlVG9nWm14bGVEdGNibHgwYjNWMGJHbHVaVG9nYm05dVpUdGNibjFjYmx4dUkwcFRSUzFEWVhCMFkyaGhJR1JsZEdGcGJITWdJMHBUUlMxRFlYQjBZMmhoUkdsemNHeGhlU0I3WEc1Y2RHOXdZV05wZEhrNklEQTdYRzVjZEcxaGNtZHBiam9nTUhCNE8xeHVYSFJ3WVdSa2FXNW5PaUF3Y0hnN1hHNWNkR2hsYVdkb2REb2dNSEI0TzF4dVhIUjBjbUZ1YzJsMGFXOXVPaUJ2Y0dGamFYUjVJREF1TW5Nc0lHaGxhV2RvZENBd0xqUnpPMXh1WEhSaVlXTnJaM0p2ZFc1a09pQWpabVptTzF4dWZWeHVYRzRqU2xORkxVTmhjSFJqYUdFZ1pHVjBZV2xzY3k1allYQjBZMmhoVUdGdVpXeGJiM0JsYmwwZ0kwcFRSUzFEWVhCMFkyaGhSR2x6Y0d4aGVTQjdYRzVjZEdGdWFXMWhkR2x2YmkxdVlXMWxPaUJ6Ykdsa1pVUnZkMjQ3WEc1Y2RHRnVhVzFoZEdsdmJpMWtkWEpoZEdsdmJqb2dNQzR6Y3p0Y2JseDBZVzVwYldGMGFXOXVMV1pwYkd3dGJXOWtaVG9nWm05eWQyRnlaSE03WEc1Y2RHRnVhVzFoZEdsdmJpMWtaV3hoZVRvZ01DNHpjenRjYm4xY2JseHVJMHBUUlMxRFlYQjBZMmhoSUNOS1UwVXRhVzV3ZFhRZ2UxeHVYSFJpYjNKa1pYSTZJSE52Ykdsa0lEUndlQ0FqUkRORU9FUkVPMXh1WEhSaWIzSmtaWEl0Y21Ga2FYVnpPaUEwY0hnN1hHNWNkRzFoY21kcGJqb2dNVEJ3ZUR0Y2JseDBiV2x1TFhkcFpIUm9PaUEwTUhCNE8xeHVYSFJvWldsbmFIUTZJRFF3Y0hnN1hHNWNkR04xY25OdmNqb2djRzlwYm5SbGNqdGNibHgwWm05dWRDMXphWHBsT2lBeU9IQjRPMXh1WEhSMFpYaDBMV0ZzYVdkdU9pQmpaVzUwWlhJN1hHNWNkSEJ2YzJsMGFXOXVPaUJ5Wld4aGRHbDJaVHRjYmx4MGIzWmxjbVpzYjNjNklHaHBaR1JsYmp0Y2JuMWNibHh1STBwVFJTMURZWEIwWTJoaElHUmxkR0ZwYkhNK2MzVnRiV0Z5ZVRvNkxYZGxZbXRwZEMxa1pYUmhhV3h6TFcxaGNtdGxjaUI3WEc1Y2RHUnBjM0JzWVhrNklHNXZibVU3WEc1OVhHNWNiaU5LVTBVdFEyRndkR05vWVNCa1pYUmhhV3h6SUNOS1UwVXRhVzV3ZFhRNmFHOTJaWEk2WW1WbWIzSmxJSHRjYmx4MFkyOXVkR1Z1ZERvZ0ovQ2ZwSlluTzF4dVhIUnZjR0ZqYVhSNU9pQXhPMXh1ZlZ4dVhHNGpTbE5GTFVOaGNIUmphR0V1YzNWalkyVnpjeUJrWlhSaGFXeHpJQ05LVTBVdGFXNXdkWFE2WW1WbWIzSmxJSHRjYmx4MFkyOXVkR1Z1ZERvZ0ovQ2ZtSWtuTzF4dVhIUnZjR0ZqYVhSNU9pQXhPMXh1ZlZ4dUkwcFRSUzFEWVhCMFkyaGhMbVpoYVd4bFpDQmtaWFJoYVd4eklDTktVMFV0YVc1d2RYUTZZbVZtYjNKbElIdGNibHgwWTI5dWRHVnVkRG9nSi9DZnBKWW5PMXh1WEhSdmNHRmphWFI1T2lBeE8xeHVmVnh1WEc0alNsTkZMVU5oY0hSamFHRXVkR2hwYm10cGJtY2daR1YwWVdsc2N5QWpTbE5GTFdsdWNIVjBPbUpsWm05eVpTQjdYRzVjZEdOdmJuUmxiblE2SUNmd242U2hKenRjYmx4MGIzQmhZMmwwZVRvZ01UdGNibjFjYmlOS1UwVXRRMkZ3ZEdOb1lTNXpkV05qWlhOeklHUmxkR0ZwYkhNZ0kwcFRSUzFwYm5CMWREcGhablJsY2lCN1hHNWNkR052Ym5SbGJuUTZJQ2ZpbkpRbk8xeHVYSFJ2Y0dGamFYUjVPaUF4TzF4dVhIUmpiMnh2Y2pvZ0l6STJRVVUyTUR0Y2JseDBjR0ZrWkdsdVp6b2dNSEI0SURSd2VDQXdjSGdnTlhCNE8xeHVYSFJpYjNKa1pYSXRiR1ZtZERvZ2MyOXNhV1FnTW5CNElDTkVNMFE0UkVRN1hHNTlYRzVjYmlOS1UwVXRRMkZ3ZEdOb1lTNW1ZV2xzWldRZ1pHVjBZV2xzY3lBalNsTkZMV2x1Y0hWME9tRm1kR1Z5SUh0Y2JseDBZMjl1ZEdWdWREb2dKK0tibENjN1hHNWNkRzl3WVdOcGRIazZJREU3WEc1Y2RIQmhaR1JwYm1jNklEQndlRHRjYmx4MFltOXlaR1Z5TFd4bFpuUTZJSE52Ykdsa0lESndlQ0FqUkRORU9FUkVPMXh1ZlZ4dVhHNWNiaU5LVTBVdFEyRndkR05vWVM1emRXTmpaWE56SUdSbGRHRnBiSE11WTJGd2RHTm9ZVkJoYm1Wc1cyOXdaVzVkSUNOS1UwVXRhVzV3ZFhRNllXWjBaWElnZTF4dVhIUmpiMjUwWlc1ME9pQW5KenRjYmx4MGIzQmhZMmwwZVRvZ01EdGNibHgwY0dGa1pHbHVaem9nTUhCNE8xeHVYSFJpYjNKa1pYSTZJREJ3ZUR0Y2JseDBYRzU5WEc1Y2JpTktVMFV0UTJGd2RHTm9ZU0JrWlhSaGFXeHpJQ05LVTBVdGFXNXdkWFE2WW1WbWIzSmxMRnh1STBwVFJTMURZWEIwWTJoaElHUmxkR0ZwYkhNdVkyRndkR05vWVZCaGJtVnNXMjl3Wlc1ZElDTktVMFV0YVc1d2RYUTZZbVZtYjNKbElIdGNibHgwYjNCaFkybDBlVG9nTUR0Y2JseDBMeXBtYjI1MExYTnBlbVU2SURJNGNIZzdLaTljYmx4MFkyOXVkR1Z1ZERvZ0ovQ2ZwSlluTzF4dVhIUjBjbUZ1YzJsMGFXOXVPaUJ2Y0dGamFYUjVJREF1TW5NN1hHNWNkSEJ2YzJsMGFXOXVPaUJoWW5OdmJIVjBaVHRjYmx4MGRHOXdPakJ3ZUR0Y2JseDBiR1ZtZERvd2NIZzdYRzVjZEdKdmRIUnZiVG93Y0hnN1hHNWNkSEpwWjJoME9qQndlRHRjYmx4MFltRmphMmR5YjNWdVpEb2pabVptTzF4dWZWeHVJMHBUUlMxRFlYQjBZMmhoTG5OMVkyTmxjM01nWkdWMFlXbHNjeTVqWVhCMFkyaGhVR0Z1Wld3Z0kwcFRSUzFwYm5CMWREcGlaV1p2Y21VZ2UxeHVYSFJ5YVdkb2REbzFNQ1U3WEc1OVhHNGpTbE5GTFVOaGNIUmphR0V1YzNWalkyVnpjeUJrWlhSaGFXeHpMbU5oY0hSamFHRlFZVzVsYkZ0dmNHVnVYU0FqU2xORkxXbHVjSFYwT21GbWRHVnlJSHRjYmx4MFpHbHpjR3hoZVRvZ2JtOXVaVHRjYm4xY2JpTktVMFV0UTJGd2RHTm9ZUzV6ZFdOalpYTnpJR1JsZEdGcGJITXVZMkZ3ZEdOb1lWQmhibVZzSUNOS1UwVXRhVzV3ZFhRNllXWjBaWElnZTF4dVhIUnNaV1owT2pVd0pUdGNibHgwY0c5emFYUnBiMjQ2SUdGaWMyOXNkWFJsTzF4dVhIUjBiM0E2TUhCNE8xeHVYSFJpYjNSMGIyMDZNSEI0TzF4dVhIUnlhV2RvZERvd2NIZzdYRzVjZEdKaFkydG5jbTkxYm1RNkkyWm1aanRjYm4xY2JpTktVMFV0UTJGd2RHTm9ZUzV6ZFdOalpYTnpJQ05LVTBVdGFXNXdkWFFnZTF4dVhIUnRhVzR0ZDJsa2RHZzZPVEp3ZUR0Y2JuMWNiaU5LVTBVdFEyRndkR05vWVM1emRXTmpaWE56SUdSbGRHRnBiSE11WTJGd2RHTm9ZVkJoYm1Wc1cyOXdaVzVkSUNOS1UwVXRhVzV3ZFhRZ2UxeHVYSFJ0YVc0dGQybGtkR2c2TWpCd2VEdGNibjFjYmx4dUkwcFRSUzFEWVhCMFkyaGhJR1JsZEdGcGJITXVZMkZ3ZEdOb1lWQmhibVZzVzI5d1pXNWRJQ05LVTBVdGFXNXdkWFE2WW1WbWIzSmxJSHRjYmx4MGIzQmhZMmwwZVRvZ01UdGNibjFjYmx4dUkwcFRSUzFEWVhCMFkyaGhJQ05LVTBVdGJYTm5JSHRjYmx4MFlXeHBaMjR0YzJWc1pqb2dZMlZ1ZEdWeU8xeHVYSFJ3WVdSa2FXNW5PaUF3Y0hnZ01IQjRJREJ3ZUNBMGNIZzdYRzVjZEdac1pYZzZJREU3WEc1OVhHNWNiaU5LVTBVdFEyRndkR05vWVNBalNsTkZMVzF6WnlCd0lIdGNibHgwZG1WeWRHbGpZV3d0WVd4cFoyNDZJR0p2ZEhSdmJUdGNibHgwWkdsemNHeGhlVG9nYVc1c2FXNWxMV0pzYjJOck8xeHVYSFJ0WVhKbmFXNDZJREJ3ZUR0Y2JseDBiR2x1WlMxb1pXbG5hSFE2SURFdU1qdGNibjFjYmx4dUkwcFRSUzFEWVhCMFkyaGhJQ05LVTBVdFluSmhibVFnZTF4dVhIUmliM0prWlhJdGJHVm1kRG9nYzI5c2FXUWdNM0I0SUNOR09VWTVSams3WEc1Y2RHRnNhV2R1TFhObGJHWTZJR05sYm5SbGNqdGNibHgwZDJsa2RHZzZJRFl3Y0hnN1hHNWNkR2hsYVdkb2REbzJPSEI0TzF4dVhIUndZV1JrYVc1bk9pQXdjSGdnTkhCNE8xeHVYSFIwWlhoMExXRnNhV2R1T2lCalpXNTBaWEk3WEc0Z0lDQWdaR2x6Y0d4aGVUb2dabXhsZUR0Y2JpQWdJQ0JxZFhOMGFXWjVMV052Ym5SbGJuUTZJR05sYm5SbGNqdGNiaUFnSUNCaGJHbG5iaTFqYjI1MFpXNTBPaUJqWlc1MFpYSTdYRzU5WEc1Y2JpTktVMFV0UTJGd2RHTm9ZU0FqU2xORkxXSnlZVzVrSUhOMlp5QjdYRzVjZEdacGJHdzZJQ00xTVVKR1JVTTdYRzVjZEhkcFpIUm9PaUEwT0hCNE8xeHVmVnh1WEc0alNsTkZMVU5oY0hSamFHRWdJMHBUUlMxRFlYQjBZMmhoUkdsemNHeGhlU0FqU2xORkxXTmhjSFJqYUdFdFoyRnRaUzFqYjI1MFlXbHVaWElnZTF4dVhIUmlZV05yWjNKdmRXNWtPaUFqUmpKR09FWkdPMXh1WEhSaWIzSmtaWEl0Y21Ga2FYVnpPaUEyY0hnN1hHNWNkR2hsYVdkb2REb2dNVEF3SlR0Y2JseDBjRzl6YVhScGIyNDZjbVZzWVhScGRtVTdYRzVjZEc5MlpYSm1iRzkzT21ocFpHUmxianRjYm4xY2JpTktVMFV0UTJGd2RHTm9ZU0FqU2xORkxVTmhjSFJqYUdGRWFYTndiR0Y1SUNOS1UwVXRZMkZ3ZEdOb1lTMW5ZVzFsSUh0Y2JseDBhR1ZwWjJoME9qRXdNQ1U3WEc1OVhHNWNibHh1UUd0bGVXWnlZVzFsY3lCemJHbGtaVVJ2ZDI0Z2UxeHVYSFJtY205dElIdGNibHgwWEhSdmNHRmphWFI1T2lBd08xeHVYSFJjZEdobGFXZG9kRG9nTUR0Y2JseDBYSFJ3WVdSa2FXNW5PaUE0Y0hnN1hHNWNkRngwWW05eVpHVnlMWFJ2Y0RvZ2MyOXNhV1FnTkhCNElDTkdPVVk1UmprN1hHNWNkSDFjYmx4dVhIUjBieUI3WEc1Y2RGeDBiM0JoWTJsMGVUb2dNVHRjYmx4MFhIUm9aV2xuYUhRNklERTVNSEI0TzF4dVhIUmNkSEJoWkdScGJtYzZJRGh3ZUR0Y2JseDBYSFJpYjNKa1pYSXRkRzl3T2lCemIyeHBaQ0EwY0hnZ0kwWTVSamxHT1R0Y2JseDBYSFF2S21obGFXZG9kRG9nZG1GeUtDMHRZMjl1ZEdWdWRFaGxhV2RvZENrN0tpOWNibHgwZlZ4dWZWeHVYRzRqU2xORkxVTmhjSFJqYUdFZ1pHVjBZV2xzY3lBalNsTkZMVzF6Wno1d09tRm1kR1Z5SUh0Y2JseDBZMjl1ZEdWdWREb2dKMGx0SUdoMWJXRnVKenRjYm4xY2JseHVJMHBUUlMxRFlYQjBZMmhoSUdSbGRHRnBiSE11WTJGd2RHTm9ZVkJoYm1Wc1cyOXdaVzVkSUNOS1UwVXRiWE5uUG5BNllXWjBaWElzWEc0alNsTkZMVU5oY0hSamFHRXVjM1ZqWTJWemN5QmtaWFJoYVd4ekxtTmhjSFJqYUdGUVlXNWxiRnR2Y0dWdVhTQWpTbE5GTFcxelp6NXdPbUZtZEdWeUlIdGNibHgwWTI5dWRHVnVkRG9nSjBsdElHNXZkQ0JoSUhKdlltOTBKenRjYm4xY2JseHVJMHBUUlMxRFlYQjBZMmhoTG5OMVkyTmxjM01nWkdWMFlXbHNjeUFqU2xORkxXMXpaejV3T21GbWRHVnlJSHRjYmx4MFkyOXVkR1Z1ZERvZ0oxWmxjbWxtYVdWa0lHaDFiV0Z1Snp0Y2JuMWNiaU5LVTBVdFEyRndkR05vWVM1bVlXbHNaV1FnWkdWMFlXbHNjeUFqU2xORkxXMXpaejV3T21GbWRHVnlJSHRjYmx4MFkyOXVkR1Z1ZERvZ0owWmhhV3hsWkNCMlpYSnBabWxqWVhScGIyNG5PMXh1ZlZ4dUkwcFRSUzFEWVhCMFkyaGhMblJvYVc1cmFXNW5JR1JsZEdGcGJITWdJMHBUUlMxdGMyYytjRHBoWm5SbGNpQjdYRzVjZEdOdmJuUmxiblE2SUNkV1pYSnBabmxwYm1jZ0xpNHVKenRjYm4xY2JseHVJMHBUUlMxcGJuQjFkQ0JwYm5CMWRGdDBlWEJsUFZ3aVkyaGxZMnRpYjNoY0lsMGdlMXh1WEhRdktuQnZjMmwwYVc5dU9pQmhZbk52YkhWMFpUdGNibHgwZEc5d09pQXROVEJ3ZURzcUwxeHVmVnh1STBwVFJTMURZWEIwWTJoaExtRmpkR2wyWlNCN1hHNWNkR1JwYzNCc1lYazZZbXh2WTJzN1hHNTlYRzR2S2lvcUtpOWNibHh1WEc0dVoyWjRJSHRjYmx4MGNHOXphWFJwYjI0NllXSnpiMngxZEdVN1hHNWNkRzl3WVdOcGRIazZNVHRjYmx4MGRISmhibk5wZEdsdmJqb2diM0JoWTJsMGVTQXdMalp6TzF4dWZWeHVYRzR1WjJaNExtRmpkR2wyWlNCN1hHNWNkRzl3WVdOcGRIazZNRHRjYm4xY2JseHVYRzR1WjJGdFpTQjdYRzVjZEdobGFXZG9kRG94TURBbE8xeHVYSFJpWVdOclozSnZkVzVrTFhOcGVtVTZNelV3Y0hnN1hHNWNkR0poWTJ0bmNtOTFibVF0Y21Wd1pXRjBPbTV2TFhKbGNHVmhkRHRjYmx4MFltRmphMmR5YjNWdVpDMXBiV0ZuWlRwMWNtd29YQ0prWVhSaE9tbHRZV2RsTDNOMlp5dDRiV3dzSlRORGMzWm5JSGh0Ykc1elBTZG9kSFJ3T2k4dmQzZDNMbmN6TG05eVp5OHlNREF3TDNOMlp5Y2dkMmxrZEdnOUp6STFOQzQzTXpJbklHaGxhV2RvZEQwbk1UUXlMalkxSnlCMmFXVjNRbTk0UFNjd0lEQWdNalUwTGpjek1pQXhOREl1TmpVbkpUTkZKVE5EY21WamRDQjNhV1IwYUQwbk1qVTBMamN6TWljZ2FHVnBaMmgwUFNjeE5ESXVOalVuSUdacGJHdzlKeVV5TXpJMk1UTTJaU2N2SlRORkpUTkRaeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNneE15NDNPVGtnT0M0ek1qWXBKeVV6UlNVelEyY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTmpZdU56STFJREUyTGpFMU55a25KVE5GSlRORGNHRjBhQ0JrUFNkTk5qQXdMakEwTWl3eU5qRXVPRGd6UVRRMkxqZzBNaXcwTmk0NE5ESXNNQ3d4TERBc05UVXpMaklzTWpFMUxqQTBNbUUwTmk0NU15dzBOaTQ1TXl3d0xEQXNNQ3cwTmk0NE5ESXNORFl1T0RReVdpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRVMU15NHlJQzB4TmpndU1pa25JR1pwYkd3OUp5VXlNek16TVRFM09DY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMDJNemN1TURNNUxESTVNaTQxTnpoQk5EQXVOVE01TERRd0xqVXpPU3d3TERFc01DdzFPVFl1TlN3eU5USXVNRE01WVRRd0xqWXhOaXcwTUM0Mk1UWXNNQ3d3TERBc05EQXVOVE01TERRd0xqVXpPVm9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMDFPVEF1TVRrM0lDMHlNRFV1TVRrM0tTY2dabWxzYkQwbkpUSXpNMkV4TlRnd0p5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRUWTVOQzQxTkRJc016UXdMakk0TlVFek1DNDNORE1zTXpBdU56UXpMREFzTVN3d0xEWTJNeTQ0TERNd09TNDFORE5oTXpBdU9EQTNMRE13TGpnd055d3dMREFzTUN3ek1DNDNORElzTXpBdU56UXpXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUWTBOeTQzTURFZ0xUSTJNaTQzTURFcEp5Qm1hV3hzUFNjbE1qTTBOREUxT0dZbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk56VXhMalV6TkN3ek9EY3VOVFkzUVRJeExqQXpOQ3d5TVM0d016UXNNQ3d4TERBc056TXdMalVzTXpZMkxqVXpOR0V5TVM0d056SXNNakV1TURjeUxEQXNNQ3d3TERJeExqQXpOQ3d5TVM0d016UmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE56QTBMalk1TWlBdE16RTVMalk1TWlrbklHWnBiR3c5SnlVeU16VXlNV0k1TmljZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBNdlp5VXpSU1V6UTJjZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9NQ2tuSlRORkpUTkRjR0YwYUNCa1BTZE5NVEV5TGpReE15dzVNaTQwTVRGQk1UY3VOakEyTERFM0xqWXdOaXd3TERFc01DdzVOQzQ0TERjMExqaGhNVGN1TmpRekxERTNMalkwTXl3d0xEQXNNQ3d4Tnk0Mk1UTXNNVGN1TmpFeldpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRrMExqZ2dMVFUzTGpJcEp5Qm1hV3hzUFNjbE1qTXpOREV5TnpBbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk1USTJMak0wTERFd015NDVOalpoTVRVdU1qTXpMREUxTGpJek15d3dMREVzTUMweE5TNHlOQzB4TlM0eU5Dd3hOUzR5Tml3eE5TNHlOaXd3TERBc01Dd3hOUzR5TkN3eE5TNHlORm9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMHhNRGd1TnpJM0lDMDNNUzR4TWpjcEp5Qm1hV3hzUFNjbE1qTXpaREV5TnpNbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk1UUTNMamsxT0N3eE1qRXVPVUV4TVM0MU5Td3hNUzQxTlN3d0xERXNNQ3d4TXpZdU5Dd3hNVEF1TXpRekxERXhMalUzTXl3eE1TNDFOek1zTUN3d0xEQXNNVFEzTGprMU9Dd3hNakV1T1ZvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzB4TXpBdU16UTFJQzA1TWk0M05EVXBKeUJtYVd4c1BTY2xNak0wT1RFeU56a25JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5NVFk1TGpRc01UTTVMall3T0dFM0xqa3NOeTQ1TERBc01Td3dMVGN1T1MwM0xqa3NOeTQ1TWpFc055NDVNakVzTUN3d0xEQXNOeTQ1TERjdU9Wb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MweE5URXVOemt4SUMweE1UUXVNVEEyS1NjZ1ptbHNiRDBuSlRJek5UVXhORGRtSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UXk5bkpUTkZKVE5EWnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3hPVEV1TnpjM0lERTBMamt3TlNrbkpUTkZKVE5EY0dGMGFDQmtQU2ROTVRReE9DNDVOVElzTVRjeUxqbGhOaTQyTlRJc05pNDJOVElzTUN3eExEQXROaTQyTlRJdE5pNDJOVElzTmk0Mk5pdzJMalkyTERBc01Dd3dMRFl1TmpVeUxEWXVOalV5V2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVEUwTVRJdU15QXRNVFU1TGpZcEp5Qm1hV3hzUFNjbE1qTXpOREV5TnpBbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk1UUXlOQzR5TkRrc01UYzNMak14TkdFMUxqYzFOeXcxTGpjMU55d3dMREVzTUMwMUxqYzFMVFV1TnpVc05TNDNOelFzTlM0M056UXNNQ3d3TERBc05TNDNOU3cxTGpjMVdpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRFME1UY3VOVGszSUMweE5qUXVPRGs0S1NjZ1ptbHNiRDBuSlRJek0yUXhNamN6SnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRFME16SXVNelkzTERFNE5DNHdNelJoTkM0ek5qY3NOQzR6Tmpjc01Dd3hMREF0TkM0ek5qY3ROQzR6Tmpjc05DNHpPQ3cwTGpNNExEQXNNQ3d3TERRdU16WTNMRFF1TXpZM1dpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRFME1qVXVOekUxSUMweE56TXVNREUxS1NjZ1ptbHNiRDBuSlRJek5Ea3hNamM1SnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRFME5EQXVORGcwTERFNU1DNDNOamhoTWk0NU9EUXNNaTQ1T0RRc01Dd3hMREF0TWk0NU9EUXRNaTQ1T0RRc01pNDVPRGdzTWk0NU9EZ3NNQ3d3TERBc01pNDVPRFFzTWk0NU9EUmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE1UUXpNeTQ0TXpJZ0xURTRNUzR4TXpJcEp5Qm1hV3hzUFNjbE1qTTFOVEUwTjJZbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlROREwyY2xNMFVsTTBNdlp5VXpSU1V6UTJjZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9NVGs0TGprNU55QTJOUzQwT0RncEp5VXpSU1V6UTNCaGRHZ2daRDBuVFRFek56Y3VORE16TERRM01DNHpPR0V4TUM0eU5Dd3hNQzR5TkN3d0xERXNNQzB4TUM0eU16TXRNVEF1TWpRM0xERXdMakkyTXl3eE1DNHlOak1zTUN3d0xEQXNNVEF1TWpNekxERXdMakkwTjFvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzB4TXpZM0xqRTROU0F0TkRRNUxqa3BKeUJtYVd4c1BTY2xNak5tTmpZbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk1UTTVNUzR3TnpZc05EUTVMamxoTVRBdU1qUXNNVEF1TWpRc01Dd3hMREVzTUN3eU1DNDBPR010TVM0d016TXRMakkzTnkwekxqSXRMalExTVMweUxqZzFNeTB4TGpReE1pNHhOelV0TGpRNExERXVOVFF6TGpFNE9Td3lMamt1TXpBMkxERXVPREExTGpFek1Td3pMamN0TGpJek15d3pMamt4TmkwdU9ERTFMak13TmkwdU9EY3pMVEV1T0RZekxTNHlPVEV0TkM0ek5qY3RMalF5TWkweUxqazJPUzB1TVRZdE5pNHpOell0TVM0d016TXROaTR5T0RndE1pNDBNVFl1TURjekxURXVNRFE0TERNdU1EVTNMak13Tml3MkxDNDFOamdzTXl3dU1qYzNMRFV1T1RVekxTNDFOVE1zTmk0eE1UUXRNaTR6TGpFMkxURXVOemMyTFRJdU56TTNMVEV1TXpJMUxUWXVNRGcwTFRFdU5DMHpMakV6TFM0d056TXROeTR4TFRFdU1UTTFMVGN1TWpNMExUTXVNREk0TFM0eE5EWXRNaTR3TXpnc015NHdOVGN0TVM0eE9UUXNOaTR3T0RRdE1TNHlOVElzTXk0d05UY3RMakExT0N3MUxqazFNeTB4TGpBek5DdzFMalF4TlMwekxqQTNNUzB1TWpreExURXVNVEEyTFRJdU1URXhMUzQwTURndE5DNHpOamN0TGpNd05uTXROQzQ1T1RNdExqTTNPQzAxTGpFMk55MHhMak14WXkwdU16SXRNUzQzTkRjc015NDNPRFF0TXk0ME1EWXNOUzQ1TXprdE15NDJNalZhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RNVE00TUM0NE1qa2dMVFEwT1M0NUtTY2dabWxzYkQwbkpUSXpZelF6WmpVM0p5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRURXpOemN1TXpRNExEUTBPUzQ1WXk0ek16VXNNQ3d1TmpjdU1ERTFMams1TGpBME5HZ3RMakl6TTJFeE1DNHlOU3d4TUM0eU5Td3dMREFzTUMwdU9Ua3NNakF1TkRVeExERXdMakkwT1N3eE1DNHlORGtzTUN3d0xERXNMakl6TXkweU1DNDFXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xURXpOamN1TVNBdE5EUTVMamtwSnlCbWFXeHNQU2NsTWpOa1pqazVabVluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5ETDJjbE0wVWxNME5uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtEY3lMakkzTVNBek5DNHpNemdwSnlVelJTVXpRM0JoZEdnZ1pEMG5UVFE1T0M0M01qY3NNalF3TGpNMU5HRXlMakl5Tnl3eUxqSXlOeXd3TERFc01DMHlMakl5TnkweUxqSXlOeXd5TGpJek5pd3lMakl6Tml3d0xEQXNNQ3d5TGpJeU55d3lMakl5TjFvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzAwT1RZdU5TQXRNak0xTGprcEp5Qm1hV3hzUFNjbE1qTTNZekV6TnpBbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk5UQTFMalU0T1N3eU16Z3VNekUxWVRJdU1qSTRMREl1TWpJNExEQXNNQ3d4TFRFdU1qSXpMRFF1TURrc01TNDFPRElzTVM0MU9ESXNNQ3d3TERFdExqSTJNaTB1TURFMUxESXVNakk0TERJdU1qSTRMREFzTUN3eExERXVNakl6TFRRdU1EbGpMakE0Tnl3d0xDNHhOelV1TURFMUxqSTJNaTR3TVRWYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TlRBeUxqRXpPU0F0TWpNM0xqazFNU2tuSUdacGJHdzlKeVV5TTJKbE1qTTROU2NnWm1sc2JDMXlkV3hsUFNkbGRtVnViMlJrSnk4bE0wVWxNME12WnlVelJTVXpRMmNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb01URXlMakF5TkNBMU5TNDVPRE1wSnlVelJTVXpRM0JoZEdnZ1pEMG5UVGM0TkM0NU5ESXNOREUxTGpJNE5FRXhOUzR6TkRJc01UVXVNelF5TERBc01Td3dMRGMyT1M0MkxETTVPUzQ1TkRKaE1UVXVNemN5TERFMUxqTTNNaXd3TERBc01Dd3hOUzR6TkRJc01UVXVNelF5V2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVGMyT1M0MklDMHpPRFF1TmlrbklHWnBiR3c5SnlVeU16WTRNemhoTkNjZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBOd1lYUm9JR1E5SjAwNE1EUXVNVFkzTERRek1TNHlNelJCTVRJdU1EWTNMREV5TGpBMk55d3dMREVzTUN3M09USXVNU3cwTVRrdU1UWTNZVEV5TGpBNU1pd3hNaTR3T1RJc01Dd3dMREFzTVRJdU1EWTNMREV5TGpBMk4xb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MwM09EZ3VPREkxSUMwME1ETXVPREkxS1NjZ1ptbHNiRDBuSlRJek56azBaR0ZsSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRneE9TNDNNVGdzTkRRMExqRXpObUU1TGpReE9DdzVMalF4T0N3d0xERXNNQzA1TGpReE9DMDVMalF4T0N3NUxqUXpNeXc1TGpRek15d3dMREFzTUN3NUxqUXhPQ3c1TGpReE9Gb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MwNE1EUXVNemMySUMwME1Ua3VNemMyS1NjZ1ptbHNiRDBuSlRJek9XVTNaV00xSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRneU55NHhOVEVzTkRVd0xqTkJPQzR4TlRFc09DNHhOVEVzTUN3eExEQXNPREU1TERRME1pNHhOVEZoT0M0eE5qWXNPQzR4TmpZc01Dd3dMREFzT0M0eE5URXNPQzR4TlRGYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0T0RFeExqZ3dPU0F0TkRJMkxqZ3dPU2tuSUdacGJHdzlKeVV5TTJabVppY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTXZaeVV6UlNVelEyY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTkRRdU1UTTBJREV4TkM0eE1pa25KVE5GSlRORGNHRjBhQ0JrUFNkTk16QXpMams0TkN3NE9EZ3VNVFEzWVM0M05UVXVOelUxTERBc01Dd3hMQzR6T1RNdU1XTXVNVEUyTGpBM015d3hNeTQ1TnpRdE55NDNOek1zTVRRdU1EUTNMVGN1TmpVMmN5MHhNeTQyTWpVc09DNHlNUzB4TXk0Mk1qVXNPQzR6TjJFdU9DNDRMREFzTVN3eExURXVOaXd3TEM0M09TNDNPU3d3TERBc01Td3VOemcyTFM0NE1UVmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE16QXpMakU1TnlBdE9EWTJMalV6TVNrbklHWnBiR3c5SnlVeU0yWm1ZeWNnWm1sc2JDMXlkV3hsUFNkbGRtVnViMlJrSnk4bE0wVWxNME53WVhSb0lHUTlKMDB6TURRdU9USTJMRGt6TkM0NU5USmhMall5Tmk0Mk1qWXNNQ3d4TERBc01DMHhMakkxTWk0Mk1qRXVOakl4TERBc01Dd3dMUzQyTWpZdU5qSTJMall6TVM0Mk16RXNNQ3d3TERBc0xqWXlOaTQyTWpaYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TXpBMExqRXpPU0F0T1RFeExqa3dPU2tuSUdacGJHdzlKeVV5TTJabU5pY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMHpNRFV1T0RJeUxEa3pOaTR6TkRSaExqUXlNaTQwTWpJc01Dd3hMREF0TGpReU1pMHVOREl5TGpReU1pNDBNaklzTUN3d0xEQXNMalF5TWk0ME1qSmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE16QTFMakEzT1NBdE9URXpMalEwTnlrbklHWnBiR3c5SnlVeU0yWmpNQ2NnWm1sc2JDMXlkV3hsUFNkbGRtVnViMlJrSnk4bE0wVWxNME53WVhSb0lHUTlKMDAwTWpVdU9UUXpMRGM1Tmk0ek56SmpMakF5T1MwdU1ERTFMREl4TGpNMk9DMHhNaTQwTVRZc01qRXVOQzB4TWk0ek56TnpMVEl4TGpJd09Dd3hNaTQxT1RFdE1qRXVNalV5TERFeUxqWXlZeTB1TWpreExqRTNOUzB1TkRBNExTNHdPRGN0TGpFME5pMHVNalEzV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVFF3Tnk0NU5URWdMVGM0TXk0NU9Ua3BKeUJtYVd4c1BTY2xNak5tWm1NbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlROREwyY2xNMFVsTTBObklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLRGN1TnpjeklEUXVNRGtwSnlVelJTVXpRM0JoZEdnZ1pEMG5UVFkwTVM0NE5qUXNNVEV4TGpJeE0yRXVNell1TXpZc01Dd3dMREFzTGpNMk5DMHVNelkwTGpNME9DNHpORGdzTUN3d0xEQXRMak0yTkMwdU16UTVMak0xTnk0ek5UY3NNQ3d4TERBc01Dd3VOekV6V2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVFUxTlM0NE9UWWdMVGs0TGpVd05pa25JR1pwYkd3OUp5VXlNMlptWmljZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBOd1lYUm9JR1E5SjAwME9EQXVOVFkwTERneExqWXlPR0V1TXpZMExqTTJOQ3d3TERFc01DMHVNelkwTFM0ek5qUXVNemN1TXpjc01Dd3dMREFzTGpNMk5DNHpOalJhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3ROREU0TGpBM05TQXROek11TWpFMEtTY2dabWxzYkQwbkpUSXpabVptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRReE5pNHpOalFzTWpjNUxqSXlPR0V1TXpZMExqTTJOQ3d3TERFc01DMHVNelkwTFM0ek5qUXVNemN1TXpjc01Dd3dMREFzTGpNMk5DNHpOalJhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RNell6TGpJeUlDMHlOREl1TURVeEtTY2dabWxzYkQwbkpUSXpabVptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRVMU5DNHdOalFzTlRNd0xqQXlPR0V1TXpZMExqTTJOQ3d3TERFc01DMHVNelkwTFM0ek5qUXVNemN1TXpjc01Dd3dMREFzTGpNMk5DNHpOalJhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RORGd3TGpnM05pQXRORFUyTGpNME5Ta25JR1pwYkd3OUp5VXlNMlptWmljZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBOd1lYUm9JR1E5SjAwME1qRXVNalkwTERZMU1pNHlNVE5oTGpNMU55NHpOVGNzTUN3d0xEQXNMak0yTkMwdU16UTVMak0zTGpNM0xEQXNNQ3d3TFM0ek5qUXRMak0yTkM0ek5UY3VNelUzTERBc01Td3dMREFzTGpjeE0xb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0Mwek5qY3VOREEySUMwMU5qQXVOelUzS1NjZ1ptbHNiRDBuSlRJelptWm1KeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVFEzTXk0eE5qUXNOall5TGpBeU9HRXVNelkwTGpNMk5Dd3dMREVzTUMwdU16WTBMUzR6TmpRdU16Y3VNemNzTUN3d0xEQXNMak0yTkM0ek5qUmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE5ERXhMamMxTWlBdE5UWTVMakV6TVNrbklHWnBiR3c5SnlVeU0yWm1aaWNnWm1sc2JDMXlkV3hsUFNkbGRtVnViMlJrSnk4bE0wVWxNME53WVhSb0lHUTlKMDAyT0RjdU9UWTBMRGcwTnk0eE1qaGhMak0yTkM0ek5qUXNNQ3d4TERBdExqTTJOQzB1TXpZMExqTTJMak0yTERBc01Dd3dMQzR6TmpRdU16WTBXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUVTVOUzR5T0RVZ0xUY3lOeTR5T0RjcEp5Qm1hV3hzUFNjbE1qTm1abVluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTmpJeExqTTJOQ3c0T1RFdU56RXpZUzR6Tmk0ek5pd3dMREFzTUN3dU16WTBMUzR6TmpRdU16UTRMak0wT0N3d0xEQXNNQzB1TXpZMExTNHpORGt1TXpVM0xqTTFOeXd3TERFc01Dd3dMQzQzTVROYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TlRNNExqTTRJQzAzTmpVdU16azFLU2NnWm1sc2JEMG5KVEl6Wm1abUp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRURTNPUzR5TmpRc05qZzVMakV5T0dFdU16WTBMak0yTkN3d0xERXNNQzB1TXpZMExTNHpOalF1TXpndU16Z3NNQ3d3TERBc0xqTTJOQzR6TmpSYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TVRZd0xqWXpNaUF0TlRreUxqSTROaWtuSUdacGJHdzlKeVV5TTJabVppY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMDNPVGt1TVRZMExEWTBNaTR5TWpoaExqTTJOQzR6TmpRc01Dd3hMREF0TGpNMk5DMHVNelkwTGpNMkxqTTJMREFzTUN3d0xDNHpOalF1TXpZMFdpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRZNU1DNHlPVGtnTFRVMU1pNHlNVE1wSnlCbWFXeHNQU2NsTWpObVptWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5NVEF5T0M0M05qUXNOelExTGpreU9HRXVNelkwTGpNMk5Dd3dMREVzTUMwdU16WTBMUzR6TmpRdU16Y3VNemNzTUN3d0xEQXNMak0yTkM0ek5qUmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE9EZzJMalEzT0NBdE5qUXdMamd4T0NrbklHWnBiR3c5SnlVeU0yWm1aaWNnWm1sc2JDMXlkV3hsUFNkbGRtVnViMlJrSnk4bE0wVWxNME53WVhSb0lHUTlKMDB4TWpRekxqWTJOQ3cxTkRNdU5ESTRZUzR6TmpRdU16WTBMREFzTVN3d0xTNHpOalF0TGpNMk5DNHpOaTR6Tml3d0xEQXNNQ3d1TXpZMExqTTJORm9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMHhNRGN3TGpBNU55QXRORFkzTGpjNU5Da25JR1pwYkd3OUp5VXlNMlptWmljZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBOd1lYUm9JR1E5SjAweE5EQXhMalkyTkN3ek5EZ3VNekk0WVM0ek5qUXVNelkwTERBc01Td3dMUzR6TmpRdExqTTJOQzR6Tnk0ek55d3dMREFzTUN3dU16WTBMak0yTkZvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzB4TWpBMUxqQTVPQ0F0TXpBeExqQTVNeWtuSUdacGJHdzlKeVV5TTJabVppY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMHhNell5TGpFMk5Dd3lOVFF1TlRJNFlTNHpOalF1TXpZMExEQXNNU3d3TFM0ek5qUXRMak0yTkM0ek5pNHpOaXd3TERBc01Dd3VNelkwTGpNMk5Gb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MweE1UY3hMak0wT0NBdE1qSXdMamswTnlrbklHWnBiR3c5SnlVeU0yWm1aaWNnWm1sc2JDMXlkV3hsUFNkbGRtVnViMlJrSnk4bE0wVWxNME53WVhSb0lHUTlKMDB4TkRjekxqazBOQ3d5TURNdU5qRXpZUzR6TlRjdU16VTNMREFzTVN3d0xEQXRMamN4TXk0ek5EZ3VNelE0TERBc01Dd3dMUzR6TkRrdU16WTBMak16Tmk0ek16WXNNQ3d3TERBc0xqTTBPUzR6TkRsYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TVRJMk5pNDROamtnTFRFM055NDBOVFlwSnlCbWFXeHNQU2NsTWpObVptWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5NVFUxTWk0ek5qUXNNVGszTGpjeU9HRXVNelkwTGpNMk5Dd3dMREVzTUMwdU16WTBMUzR6TmpRdU16WXVNellzTUN3d0xEQXNMak0yTkM0ek5qUmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE1UTXpNeTQ0TmpJZ0xURTNNaTQwTVRVcEp5Qm1hV3hzUFNjbE1qTm1abVluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTVRRMU15NHpOalFzTVRVM0xqY3lPR0V1TXpZMExqTTJOQ3d3TERFc01DMHVNelkwTFM0ek5qUXVNelV5TGpNMU1pd3dMREFzTUN3dU16WTBMak0yTkZvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzB4TWpRNUxqSTNNeUF0TVRNNExqSXpOeWtuSUdacGJHdzlKeVV5TTJabVppY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMHhNekExTGpNMk5Dd3pPUzQzTWpoaExqTTJOQzR6TmpRc01Dd3hMREF0TGpNMk5DMHVNelkwTGpNM0xqTTNMREFzTUN3d0xDNHpOalF1TXpZMFdpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRFeE1qSXVPREUySUMwek55NDBNVE1wSnlCbWFXeHNQU2NsTWpObVptWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5NVFkzTXk0ek5qUXNNemt1TnpJNFlTNHpOalF1TXpZMExEQXNNU3d3TFM0ek5qUXRMak0yTkM0ek55NHpOeXd3TERBc01Dd3VNelkwTGpNMk5Gb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MweE5ETTNMakkwT1NBdE16Y3VOREV6S1NjZ1ptbHNiRDBuSlRJelptWm1KeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVEUyTmpNdU5EWTBMREl5T1M0NE1qaGhMak0yTkM0ek5qUXNNQ3d4TERBdExqTTJOQzB1TXpZMExqTTJMak0yTERBc01Dd3dMQzR6TmpRdU16WTBXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xURTBNamd1TnprZ0xURTVPUzQ0TkRJcEp5Qm1hV3hzUFNjbE1qTm1abVluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTVRVek9TNDVOalFzTkRjeExqZ3lPR0V1TXpZMExqTTJOQ3d3TERFc01DMHVNelkwTFM0ek5qUXVNell1TXpZc01Dd3dMREFzTGpNMk5DNHpOalJhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RNVE15TXk0eU5qY2dMVFF3Tmk0Mk1UWXBKeUJtYVd4c1BTY2xNak5tWm1ZbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk1UWTFNUzR3TmpRc05UYzRMakF5T0dFdU16WTBMak0yTkN3d0xERXNNQzB1TXpZMExTNHpOalF1TXpjdU16Y3NNQ3d3TERBc0xqTTJOQzR6TmpSYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TVRReE9DNHhPVFVnTFRRNU55NHpOVGdwSnlCbWFXeHNQU2NsTWpObVptWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5NVFU1TVM0NE5qUXNOelV6TGpReE0yRXVNell1TXpZc01Dd3dMREFzTGpNMk5DMHVNelkwTGpNME9DNHpORGdzTUN3d0xEQXRMak0yTkMwdU16UTVMak0xTnk0ek5UY3NNQ3d4TERBc01Dd3VOekV6V2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVEV6TmpjdU5qRXlJQzAyTkRjdU1qSTJLU2NnWm1sc2JEMG5KVEl6Wm1abUp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRURXlOek11TWpZMExEY3pPQzQxTWpoaExqTTJOQzR6TmpRc01Dd3hMREF0TGpNMk5DMHVNelkwTGpNMkxqTTJMREFzTUN3d0xDNHpOalF1TXpZMFdpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRFd09UVXVNemc0SUMwMk16UXVORGsxS1NjZ1ptbHNiRDBuSlRJelptWm1KeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVEV4TkRJdU16WTBMRGcxT1M0MU1qaGhMak0yTkM0ek5qUXNNQ3d4TERBdExqTTJOQzB1TXpZMExqTTRMak00TERBc01Dd3dMQzR6TmpRdU16WTBXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUazRNeTQxTkRJZ0xUY3pOeTQ0T0RJcEp5Qm1hV3hzUFNjbE1qTm1abVluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTVRBeU5pNHpOalFzTVRJekxqWXlPR0V1TXpRNExqTTBPQ3d3TERBc01Dd3VNelE1TFM0ek5qUXVNelUzTGpNMU55d3dMREVzTUMwdU16UTVMak0yTkZvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzA0T0RRdU5ESTNJQzB4TURrdU1UQXhLU2NnWm1sc2JEMG5KVEl6Wm1abUp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRURXpNaTR6TmpRc05USXVNREk0WVM0ek5EZ3VNelE0TERBc01Dd3dMQzR6TkRrdExqTTJOQzR6TlRjdU16VTNMREFzTVN3d0xTNDNNVE1zTUN3dU16Y3VNemNzTUN3d0xEQXNMak0yTkM0ek5qUmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE1USXdMalUxT1NBdE5EY3VPVEl6S1NjZ1ptbHNiRDBuSlRJelptWm1KeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVEUwTlM0eUxEWXlMalE1TkdFdU5Ua3VOVGtzTUN3d0xEQXNMall0TGpZdU5pNDJMREFzTUN3d0xTNDJMUzQyTGpZd09TNDJNRGtzTUN3d0xEQXRMall1Tmk0MkxqWXNNQ3d3TERBc0xqWXVObG9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMHhNekV1TXpJMUlDMDFOaTQwTmpjcEp5Qm1hV3hzUFNjbE1qTm1abVluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTWpjNUxqWXNNamt1TWprMFlTNDJMallzTUN3d0xEQXNMall0TGpZdU5qQTVMall3T1N3d0xEQXNNQzB1TmkwdU5pNDJMallzTUN3d0xEQXRMall1Tmk0MU9TNDFPU3d3TERBc01Dd3VOaTQyV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVEkwTmk0eE5qRWdMVEk0TGpFcEp5Qm1hV3hzUFNjbE1qTm1abVluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTXpJNUxEYzJMakU1TkdFdU5qQTVMall3T1N3d0xEQXNNQ3d1TmkwdU5pNDJMallzTUN3d0xEQXRMall0TGpZdU5pNDJMREFzTUN3d0xEQXNNUzR4T1RSYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TWpnNExqTTNNU0F0TmpndU1UY3pLU2NnWm1sc2JEMG5KVEl6Wm1abUp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRUWTBNUzR6TERVeUxqYzVOR0V1Tmk0MkxEQXNNQ3d3TEM0MkxTNDJMalU1TGpVNUxEQXNNQ3d3TFM0MkxTNDJMall1Tml3d0xEQXNNQ3d3TERFdU1UazBXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUVTFOUzR5TVRJZ0xUUTRMakUzT1NrbklHWnBiR3c5SnlVeU0yWm1aaWNnWm1sc2JDMXlkV3hsUFNkbGRtVnViMlJrSnk4bE0wVWxNME53WVhSb0lHUTlKMDB5TmpZdU5Dd3pOelV1TXprMFlTNDJMallzTUN3d0xEQXNMall0TGpZdU5qQTVMall3T1N3d0xEQXNNQzB1TmkwdU5pNDJMallzTUN3d0xEQXRMall1Tmk0MU9TNDFPU3d3TERBc01Dd3VOaTQyV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVEl6TkM0NE9ETWdMVE15TXk0NE1qRXBKeUJtYVd4c1BTY2xNak5tWm1ZbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk5UY3lMallzTnpFNExqWTVOR0V1Tmk0MkxEQXNNQ3d3TEM0MkxTNDJMall3T1M0Mk1Ea3NNQ3d3TERBdExqWXRMall1Tmk0MkxEQXNNU3d3TERBc01TNHhPVFJhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RORGsyTGpVeE1pQXROakUzTGpFMUtTY2dabWxzYkQwbkpUSXpabVptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRVMExEZzNOaTQyT1RSaExqWXVOaXd3TERFc01Dd3dMVEV1TVRrMExqWXdPUzQyTURrc01Dd3dMREF0TGpZdU5pNDJMallzTUN3d0xEQXNMall1TmxvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzAxTXk0MElDMDNOVEl1TVRVeUtTY2dabWxzYkQwbkpUSXpabVptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRFd01ESXVNeXc1TURndU56azBZUzQxT1M0MU9Td3dMREFzTUN3dU5pMHVOaTQyTGpZc01Dd3dMREF0TGpZdExqWXVOakE1TGpZd09Td3dMREFzTUMwdU5pNDJMalU1TGpVNUxEQXNNQ3d3TEM0MkxqWmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE9EWXpMalkyTkNBdE56YzVMalUzT1NrbklHWnBiR3c5SnlVeU0yWm1aaWNnWm1sc2JDMXlkV3hsUFNkbGRtVnViMlJrSnk4bE0wVWxNME53WVhSb0lHUTlKMDB4TVRreUxqa3NORGMwTGpFNU5HRXVOaTQyTERBc01Dd3dMQzQyTFM0MkxqVTVMalU1TERBc01Dd3dMUzQyTFM0MkxqWXVOaXd3TERFc01Dd3dMREV1TVRrMFdpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRFd01qWXVOVElnTFRRd09DNHlOQ2tuSUdacGJHdzlKeVV5TTJabVppY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMHhOVGc0TGpFc05qY3pMalE1TkdFdU5Ua3VOVGtzTUN3d0xEQXNMall0TGpZdU5pNDJMREFzTUN3d0xTNDJMUzQyTGpZd09TNDJNRGtzTUN3d0xEQXRMall1Tmk0MkxqWXNNQ3d3TERBc0xqWXVObG9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMHhNelkwTGpFNU5TQXROVGM0TGpVektTY2dabWxzYkQwbkpUSXpabVptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRrek5TNDBMREl5TUM0d09UUmhMall1Tml3d0xEQXNNQ3d1TmkwdU5pNDFPUzQxT1N3d0xEQXNNQzB1TmkwdU5pNDJMallzTUN3d0xEQXRMall1Tmk0MU9TNDFPU3d3TERBc01Dd3VOaTQyV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVGd3Tmk0MU1ESWdMVEU1TVM0eE1qY3BKeUJtYVd4c1BTY2xNak5tWm1ZbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk1UVTRNaTQyTERZekxqUTVOR0V1TmpBNUxqWXdPU3d3TERBc01Dd3VOaTB1Tmk0MkxqWXNNQ3d4TERBdE1TNHhPVFFzTUN3dU5qQTVMall3T1N3d0xEQXNNQ3d1Tmk0MldpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRFek5Ua3VORGsxSUMwMU55NHpNaklwSnlCbWFXeHNQU2NsTWpObVptWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5OamM1TGpJME55dzBORFl1T1RrMVlTNHlORGN1TWpRM0xEQXNNU3d3TFM0eU5EY3RMakkwTnk0eU5EVXVNalExTERBc01Dd3dMQzR5TkRjdU1qUTNXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUVTROeTQ1TXpjZ0xUTTROUzQxT1RjcEp5Qm1hV3hzUFNjbE1qTm1abVluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTmpjM0xqVTBOeXd4TmpBdU9UazFZUzR5TlRVdU1qVTFMREFzTUN3d0xDNHlORGN0TGpJME55NHlORFV1TWpRMUxEQXNNQ3d3TFM0eU5EY3RMakkwTnk0eU5EY3VNalEzTERBc01Td3dMREFzTGpRNU5Wb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MwMU9EWXVORGcwSUMweE5ERXVNakk0S1NjZ1ptbHNiRDBuSlRJelptWm1KeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVGsyTlM0eU5EY3NOalV1TlRrMVlTNHlOVFV1TWpVMUxEQXNNQ3d3TEM0eU5EY3RMakkwTnk0eU5EVXVNalExTERBc01Dd3dMUzR5TkRjdExqSTBOeTR5TXpjdU1qTTNMREFzTUN3d0xTNHlORGN1TWpRM0xqSTBOUzR5TkRVc01Dd3dMREFzTGpJME55NHlORGRhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RPRE15TGpNd05pQXROVGt1TnpFMEtTY2dabWxzYkQwbkpUSXpabVptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRFek1UVXVPVFE0TERJNU55NDJPVFZoTGpJME55NHlORGNzTUN3eExEQXRMakkwTnkwdU1qUTNMakl6Tnk0eU16Y3NNQ3d3TERBc0xqSTBOeTR5TkRkYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TVRFek1TNDVOVGdnTFRJMU9DNHdNamtwSnlCbWFXeHNQU2NsTWpObVptWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5NVFUyTlM0ek5EZ3NNamszTGpZNU5XRXVNalUxTGpJMU5Td3dMREFzTUN3dU1qUTNMUzR5TkRjdU1qUTFMakkwTlN3d0xEQXNNQzB1TWpRM0xTNHlORGN1TWpVMUxqSTFOU3d3TERBc01DMHVNalE0TGpJME55NHlNemN1TWpNM0xEQXNNQ3d3TEM0eU5EZ3VNalEzV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVEV6TkRVdU1EVTFJQzB5TlRndU1ESTVLU2NnWm1sc2JEMG5KVEl6Wm1abUp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRURTJNamN1TURRNExEVXhOeTQwT1RWaExqSTBOeTR5TkRjc01Dd3dMREFzTUMwdU5EazFMakkwTnk0eU5EY3NNQ3d4TERBc01Dd3VORGsxV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVEV6T1RjdU56YzBJQzAwTkRVdU9ETTFLU2NnWm1sc2JEMG5KVEl6Wm1abUp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRURXdOREV1TnpRNExEVXpOeTR5T1RWaExqSTBOeTR5TkRjc01Dd3dMREFzTUMwdU5EazFMakkwTnk0eU5EY3NNQ3d4TERBc01Dd3VORGsxV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVGc1Tnk0Mk56RWdMVFEyTWk0M05UTXBKeUJtYVd4c1BTY2xNak5tWm1ZbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk1URXpPQzR4TkRjc056STVMamc1TldFdU1qUTNMakkwTnl3d0xERXNNQzB1TWpRM0xTNHlORGN1TWpRMUxqSTBOU3d3TERBc01Dd3VNalEzTGpJME4xb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MwNU9EQXVNRE01SUMwMk1qY3VNekU0S1NjZ1ptbHNiRDBuSlRJelptWm1KeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVFF5Tmk0NU5EY3NOREEyTGpNNU5XRXVNalEzTGpJME55d3dMREVzTUN3d0xTNDBPVFV1TWpVMUxqSTFOU3d3TERBc01DMHVNalEzTGpJME55NHlORFV1TWpRMUxEQXNNQ3d3TEM0eU5EY3VNalEzV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVE0zTWk0ek5qSWdMVE0xTUM0NU1EY3BKeUJtYVd4c1BTY2xNak5tWm1ZbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk1qVTJMalEwTnl3eU1UTXVNVGsxWVM0eU5EY3VNalEzTERBc01Td3dMUzR5TkRjdExqSTBOeTR5TkRVdU1qUTFMREFzTUN3d0xDNHlORGN1TWpRM1dpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRJeU5pNDJPQ0F0TVRnMUxqZ3lPU2tuSUdacGJHdzlKeVV5TTJabVppY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMHlOVEV1TlRRM0xETXpOeTR5T1RWaExqSTBOeTR5TkRjc01Dd3hMREF0TGpJME55MHVNalEzTGpJMU5TNHlOVFVzTUN3d0xEQXNMakkwTnk0eU5EZGFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE1qSXlMalE1TXlBdE1qa3hMamcyTlNrbklHWnBiR3c5SnlVeU0yWm1aaWNnWm1sc2JDMXlkV3hsUFNkbGRtVnViMlJrSnk4bE0wVWxNME53WVhSb0lHUTlKMDB4TlRjdU56UTNMRFV4TUM0d09UVmhMakkwTnk0eU5EY3NNQ3d3TERBc01DMHVORGsxTGpJME5TNHlORFVzTUN3d0xEQXRMakkwTnk0eU5EY3VNak0zTGpJek55d3dMREFzTUN3dU1qUTNMakkwTjFvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzB4TkRJdU16UTNJQzAwTXprdU5URXlLU2NnWm1sc2JEMG5KVEl6Wm1abUp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRUSXhOQzR6TkRjc01UYzFMakU1TldFdU1qUTFMakkwTlN3d0xEQXNNQ3d1TWpRM0xTNHlORGN1TWpRM0xqSTBOeXd3TERBc01DMHVORGsxTERBc0xqSTBOUzR5TkRVc01Dd3dMREFzTGpJME55NHlORGRhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RNVGt3TGpjd09DQXRNVFV6TGpNMk1Ta25JR1pwYkd3OUp5VXlNMlptWmljZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBOd1lYUm9JR1E5SjAwek56QXVNVFFzTXpJeUxqUTVOV0V1TWpVMUxqSTFOU3d3TERBc01Dd3VNalEzTFM0eU5EY3VNalExTGpJME5Td3dMREFzTUMwdU1qUTNMUzR5TkRjdU1qVTFMakkxTlN3d0xEQXNNQzB1TWpRM0xqSTBOeTR5TXpjdU1qTTNMREFzTUN3d0xDNHlORGN1TWpRM1dpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRNeU15NDRNak1nTFRJM09TNHlNaWtuSUdacGJHdzlKeVV5TTJabVppY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMHhPVEl1TmpRM0xEZzNNaTQyT1RWaExqSTBOeTR5TkRjc01Dd3hMREF0TGpJME55MHVNalEzTGpJME5TNHlORFVzTUN3d0xEQXNMakkwTnk0eU5EZGFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE1UY3lMakUyTnlBdE56UTVMak16TWlrbklHWnBiR3c5SnlVeU0yWm1aaWNnWm1sc2JDMXlkV3hsUFNkbGRtVnViMlJrSnk4bE0wVWxNME53WVhSb0lHUTlKMDAxTkRJdU9UUTRMRGt6Tnk0eU9UVmhMakkxTlM0eU5UVXNNQ3d3TERBc0xqSTBOeTB1TWpRM0xqSTBOUzR5TkRVc01Dd3dMREF0TGpJME55MHVNalEzTGpJMU5TNHlOVFVzTUN3d0xEQXRMakkwTnk0eU5EY3VNalExTGpJME5Td3dMREFzTUN3dU1qUTNMakkwTjFvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzAwTnpFdU5EYzNJQzA0TURRdU5USTVLU2NnWm1sc2JEMG5KVEl6Wm1abUp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRURTJPVEV1TWpRNExEZzRNUzQ1T1RWaExqSTBOeTR5TkRjc01Dd3hMREF0TGpJME9DMHVNalEzTGpJMU5TNHlOVFVzTUN3d0xEQXNMakkwT0M0eU5EZGFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE1UUTFNaTQyTWprZ0xUYzFOeTR5TnpncEp5Qm1hV3hzUFNjbE1qTm1abVluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTVRNek1TNDBORGdzTmpRMExqRTVOV0V1TWpRM0xqSTBOeXd3TERBc01Dd3dMUzQwT1RVdU1qUTNMakkwTnl3d0xEQXNNQ3d3TEM0ME9UVmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE1URTBOUzR5TURJZ0xUVTFOQzR3T1RNcEp5Qm1hV3hzUFNjbE1qTm1abVluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5ETDJjbE0wVWxNME12YzNabkpUTkZYQ0lwTzF4dVhIUmpkWEp6YjNJNklIVnliQ2duWkdGMFlUcHBiV0ZuWlM5emRtY3JlRzFzTzNWMFpqZ3NQSE4yWnlCNGJXeHVjejFjSW1oMGRIQTZMeTkzZDNjdWR6TXViM0puTHpJd01EQXZjM1puWENJZ2QybGtkR2c5WENJME1Gd2lJR2hsYVdkb2REMWNJalF3WENJZ2RtbGxkMEp2ZUQxY0lqQWdNQ0EwTUNBME1Gd2lQanhuSUhSeVlXNXpabTl5YlQxY0luUnlZVzV6YkdGMFpTZ3RPRFEwSUMwMU1EQXBYQ0krUEdjZ2RISmhibk5tYjNKdFBWd2lkSEpoYm5Oc1lYUmxLRGcwTkNBdE5USXdMak0yS1Z3aVBqeHdZWFJvSUdROVhDSk5NVGswTGpjNE55d3hNakV5TGpJNVlUSXVPRFU0TERJdU9EVTRMREFzTVN3d0xESXVPRFU0TERJdU9EVTRMREl1T0RZNUxESXVPRFk1TERBc01Dd3dMVEl1T0RVNExUSXVPRFU0V2x3aUlIUnlZVzV6Wm05eWJUMWNJblJ5WVc1emJHRjBaU2d0TVRjMExqYzVNaUF0TVRjMExqYzVNeWxjSWlCbWFXeHNQVndpSlRJek9EWTROamcyWENJdlBqeHdZWFJvSUdROVhDSk5NakE1TGpReE5pd3hNakk0TGpNMVlURXVOREk1TERFdU5ESTVMREFzTVN3eExURXVOREkwTERFdU5ESTBMREV1TkRFNUxERXVOREU1TERBc01Dd3hMREV1TkRJMExURXVOREkwV2x3aUlIUnlZVzV6Wm05eWJUMWNJblJ5WVc1emJHRjBaU2d0TVRnNUxqUXlNU0F0TVRnNUxqUXhPU2xjSWlCbWFXeHNQVndpSlRJelptWTJOVFZpWENJdlBqeG5JSFJ5WVc1elptOXliVDFjSW5SeVlXNXpiR0YwWlNnd0lERXdNakF1TXpZcFhDSStQSEJoZEdnZ1pEMWNJazB5TVRZdU1ESTBMREV3TWpBdU16WjJNVEl1T0RVMWFERXVOREkwVmpFd01qQXVNelphWENJZ2RISmhibk5tYjNKdFBWd2lkSEpoYm5Oc1lYUmxLQzB4T1RZdU56TTJJQzB4TURJd0xqTTJLVndpSUdacGJHdzlYQ0lsTWpNNE5qZzJPRFpjSWk4K1BIQmhkR2dnWkQxY0lrMHlNVFl1TURJMExERXpNalF1TWpaMk1USXVPRFkyYURFdU5ESTBWakV6TWpRdU1qWmFYQ0lnZEhKaGJuTm1iM0p0UFZ3aWRISmhibk5zWVhSbEtDMHhPVFl1TnpNMklDMHhNamszTGpFeU5pbGNJaUJtYVd4c1BWd2lKVEl6T0RZNE5qZzJYQ0l2UGp4d1lYUm9JR1E5WENKTk16QTBMakF4Tml3eE1qTTJMakkzZGpFdU5ETTBhREV5TGpnMU5YWXRNUzQwTXpSYVhDSWdkSEpoYm5ObWIzSnRQVndpZEhKaGJuTnNZWFJsS0MweU56WXVPRGN4SUMweE1qRTJMams1TWlsY0lpQm1hV3hzUFZ3aUpUSXpPRFk0TmpnMlhDSXZQanh3WVhSb0lHUTlYQ0pOTUN3eE1qTTJMakkzZGpFdU5ETTBTREV5TGpnMU5YWXRNUzQwTXpSYVhDSWdkSEpoYm5ObWIzSnRQVndpZEhKaGJuTnNZWFJsS0RBZ0xURXlNVFl1T1RreUtWd2lJR1pwYkd3OVhDSWxNak00TmpnMk9EWmNJaTgrUEM5blBqeG5JSFJ5WVc1elptOXliVDFjSW5SeVlXNXpiR0YwWlNnNExqZzJNU0F4TURJNUxqSXhOaWxjSWo0OGNHRjBhQ0JrUFZ3aVRUSTBOQzQxTERFeE1Ua3VOVFE0WVM0M01UUXVOekUwTERBc01Dd3dMUzR4TWl3eExqUXdPU3d4TUN3eE1Dd3dMREFzTVN3M0xqUXNOeTR6T1RFdU56RTFMamN4TlN3d0xEQXNNQ3d4TGpNNU1TMHVNek4yTUdFeE1TNDBNekVzTVRFdU5ETXhMREFzTUN3d0xUZ3VORFUwTFRndU5EUXpMamN4T0M0M01UZ3NNQ3d3TERBdExqSXhNaTB1TURJeldsd2lJSFJ5WVc1elptOXliVDFjSW5SeVlXNXpiR0YwWlNndE1qTXdMamt4T0NBdE1URXhPUzQxTkRjcFhDSWdabWxzYkQxY0lpVXlNemcyT0RZNE5sd2lMejQ4Y0dGMGFDQmtQVndpVFRFd055NDVOekVzTVRFeE9TNDFPRGxoTGpjeU1TNDNNakVzTUN3d0xEQXRMakU1TGpBeU15d3hNUzQwTWpnc01URXVOREk0TERBc01Dd3dMVGd1TkRRc09DNDBNamN1TnpFMExqY3hOQ3d3TERBc01Dd3hMak0zT1M0ek5qbGpNQzB1TURFdU1EQTFMUzR3TWpFdU1EQTRMUzR3TXpGaE1UQXNNVEFzTUN3d0xERXNOeTR6T0RZdE55NHpOemN1TnpFMExqY3hOQ3d3TERBc01DMHVNVFF5TFRFdU5EQTVXbHdpSUhSeVlXNXpabTl5YlQxY0luUnlZVzV6YkdGMFpTZ3RPVGt1TXpFZ0xURXhNVGt1TlRnMktWd2lJR1pwYkd3OVhDSWxNak00TmpnMk9EWmNJaTgrUEhCaGRHZ2daRDFjSWsweU5USXVOREEzTERFeU5qUXVNek00WVM0M01UUXVOekUwTERBc01Dd3dMUzQzTVRJdU5UVTFMREV3TERFd0xEQXNNQ3d4TFRjdU16ZzJMRGN1TXpndU56RTBMamN4TkN3d0xEQXNNQ3d1TWpneUxERXVOR3d1TURVekxTNHdNVE5oTVRFdU5ETXNNVEV1TkRNc01Dd3dMREFzT0M0ME5DMDRMalF5T1M0M01UTXVOekV6TERBc01Dd3dMUzQyTnpndExqZzVNMXBjSWlCMGNtRnVjMlp2Y20wOVhDSjBjbUZ1YzJ4aGRHVW9MVEl6TUM0NE16VWdMVEV5TlRFdU5ERXBYQ0lnWm1sc2JEMWNJaVV5TXpnMk9EWTRObHdpTHo0OGNHRjBhQ0JrUFZ3aVRUazVMamt5TkN3eE1qWTBMakEzTjJFdU56RTBMamN4TkN3d0xEQXNNQzB1TmpVMkxqZzVMREV4TGpRek1Td3hNUzQwTXpFc01Dd3dMREFzT0M0ME5DdzRMalExTkM0M01UVXVOekUxTERBc01Dd3dMQzR6TXpVdE1TNHpPV2d3WVRrdU9UazFMRGt1T1RrMUxEQXNNQ3d4TFRjdU16ZzJMVGN1TkM0M01UUXVOekUwTERBc01Dd3dMUzQzTXpRdExqVTFPR2d3V2x3aUlIUnlZVzV6Wm05eWJUMWNJblJ5WVc1emJHRjBaU2d0T1RrdU1qUTJJQzB4TWpVeExqRTNNaWxjSWlCbWFXeHNQVndpSlRJek9EWTROamcyWENJdlBqd3ZaejQ4WnlCMGNtRnVjMlp2Y20wOVhDSjBjbUZ1YzJ4aGRHVW9NaUF4TURJeUxqTTJLVndpSUdacGJHdzlYQ0p1YjI1bFhDSWdjM1J5YjJ0bFBWd2lKVEl6TnpBM01EY3dYQ0lnYzNSeWIydGxMWGRwWkhSb1BWd2lNbHdpUGp4amFYSmpiR1VnWTNnOVhDSXhPRndpSUdONVBWd2lNVGhjSWlCeVBWd2lNVGhjSWlCemRISnZhMlU5WENKdWIyNWxYQ0l2UGp4amFYSmpiR1VnWTNnOVhDSXhPRndpSUdONVBWd2lNVGhjSWlCeVBWd2lNVGRjSWlCbWFXeHNQVndpYm05dVpWd2lMejQ4TDJjK1BDOW5Qand2Wno0OEwzTjJaejRuS1NBeE5pQXhOaXdnWVhWMGJ6dGNibjFjYmx4dUxtRnpkR1Z5YjJsa0lIdGNibHgwZDJsa2RHZzZOREJ3ZUR0Y2JseDBhR1ZwWjJoME9qUXdjSGc3WEc1Y2RHSmhZMnRuY205MWJtUXRhVzFoWjJVNklIVnliQ2hjSW1SaGRHRTZhVzFoWjJVdmMzWm5LM2h0YkN3bE0wTnpkbWNnZUcxc2JuTTlKMmgwZEhBNkx5OTNkM2N1ZHpNdWIzSm5Mekl3TURBdmMzWm5KeUIzYVdSMGFEMG5OakFuSUdobGFXZG9kRDBuTmpBbklIWnBaWGRDYjNnOUp6QWdNQ0EyTUNBMk1DY2xNMFVsTTBObklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLREFnTUNrbkpUTkZKVE5EY0dGMGFDQmtQU2ROTWpNd0xqazVOQ3d4TVM0M05ESXNNakl4TGpnMk55d3lNaTQwZGpKQk1UUXVOamN4TERFMExqWTNNU3d3TERBc01Dd3lNell1TXl3eE1pNHpOallzTWpVdU56UXhMREkxTGpjME1Td3dMREFzTUN3eU16QXVPVGswTERFeExqYzBNbG9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMHhPVFV1T0RZM0lDMHhNQzR6TmpZcEp5Qm1hV3hzUFNjbE1qTTBZVGhrWXpZbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRFME5pNHhOemtzTVRFdU9UZzBiQzR3TXpVdExqSTJPR0V6TVM0NU56WXNNekV1T1RjMkxEQXNNQ3d3TFRJd0xqTTRNU3czTGpRc01UUXVOak0xTERFMExqWXpOU3d3TERBc01Dd3hNUzR5TlRRc05TNHlOakoyTFRKRE1UUXhMalUyTERJeUxqTTNOU3d4TkRVdU16Z3pMREU0TERFME5pNHhOemtzTVRFdU9UZzBXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xURXhNUzR3T0RnZ0xURXdMak0wS1NjZ1ptbHNiRDBuSlRJek56ZGhZV1EwSnk4bE0wVWxNME53WVhSb0lHUTlKMDB5TkRFdU1EVTVMREkwTGpJeU1VRXhNQzQyTmpNc01UQXVOall6TERBc01Dd3dMREl6TXk0NUxEY3VORFF4WVRJeUxqRTJOeXd5TWk0eE5qY3NNQ3d3TERBdE9DNDBOekl0TkM0NU1UTmpMakF4TVMwdU1EVTNMakF5TWkwdU1URTBMakF6TXkwdU1UY3hZVElzTWl3d0xEQXNNQzB6TGprek5pMHVOekV6TERFeUxqWXlNU3d4TWk0Mk1qRXNNQ3d3TERFdE1TNHpOVE1zTXk0NE1td3RNVEl1T0RFc05URXVPRGcyWVRFd0xqWTJNeXd4TUM0Mk5qTXNNQ3d3TERBc01UY3VNVGM0TFRRdU56RTVMRE0xTGpFNE9Dd3pOUzR4T0Rnc01Dd3dMREFzTkM0MU56WXRNeTR6TXprc05DNDJOallzTkM0Mk5qWXNNQ3d3TERBc05TNHlMVFV1TlRBMlFUTXhMamdzTXpFdU9Dd3dMREFzTUN3eU5ERXVNRFU1TERJMExqSXlNVm9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMHhPRE11TURZMElEQXBKeUJtYVd4c1BTY2xNak5oTldNMlpUTW5MeVV6UlNVelEzQmhkR2dnWkQwblRUVXpMamt4TkN3Mk55NDRZeTQxTWpndE5pNHlOVGt0TVM0ek56SXRNVEV1T1MwMUxqTTFNUzB4TlM0NE56VkJNVGd1T1RFM0xERTRMamt4Tnl3d0xEQXNNQ3d6Tnk0eE1TdzBOaTQyTVRsaE1USXVOamN5TERFeUxqWTNNaXd3TERBc01TMHlNQzQ0TXl3eUxqQXlOaXd5TERJc01Dd3hMREF0TXk0d05qZ3NNaTQxTmpkc0xqQXhOaTR3TVRseExTNDJOVGN1TmkweExqSTVNeXd4TGpJeU9XRXpOUzQzTkRRc016VXVOelEwTERBc01Dd3dMVFF1TVRjM0xEVXVNREUzUVRFeUxqWTNNaXd4TWk0Mk56SXNNQ3d3TERBc01pNHdNVE1zTnpZdU1EQTVMREl6TGpFc01qTXVNU3d3TERBc01DdzRMall3T0N3NU1TNDVNVFlzTWpNdU1EWTBMREl6TGpBMk5Dd3dMREFzTUN3eU5DNHpMRGs0TGpVd05XRTFNUzQzTXpnc05URXVOek00TERBc01Dd3dMREl3TGprek5pMHhNaTQzT0VFeU9TNHdOeklzTWprdU1EY3lMREFzTUN3d0xEVXpMamt4TkN3Mk55NDRXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb01DQXROREV1TVRVMktTY2dabWxzYkQwbkpUSXpaREpsTTJZeEp5OGxNMFVsTTBOd1lYUm9JR1E5SjAweU5qY3VNemM0TERNMk5DNHdPRGwyTVRNdU16TXpZVFl1TmpZM0xEWXVOalkzTERBc01Dd3dMREF0TVRNdU16TXpXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUSXpOaTR3TkRVZ0xUTXlNUzQwTWpNcEp5Qm1hV3hzUFNjbE1qTTBZVGhrWXpZbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRJeE9TNDRNakVzTXpjd0xqYzFObU13TFRNdU5qZ3lMVEV1TVRrMExUWXVOalkzTFRJdU5qWTNMVFl1TmpZM1lUWXVOalkzTERZdU5qWTNMREFzTUN3d0xEQXNNVE11TXpNelF6SXhPQzQyTWpnc016YzNMalF5TWl3eU1Ua3VPREl4TERNM05DNDBNemdzTWpFNUxqZ3lNU3d6TnpBdU56VTJXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xURTROUzQ0TWpFZ0xUTXlNUzQwTWpNcEp5Qm1hV3hzUFNjbE1qTTNOMkZoWkRRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRReU1DNDVOemdzT1RZdU56RXhkakV6TGpNek0yRTJMalkyTnl3MkxqWTJOeXd3TERBc01Dd3dMVEV6TGpNek0xb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0Mwek56RXVOalExSUMwNE5TNHpOemdwSnlCbWFXeHNQU2NsTWpNMFlUaGtZelluTHlVelJTVXpRM0JoZEdnZ1pEMG5UVE0zTXk0ME1qRXNNVEF6TGpNM09HTXdMVE11TmpneUxURXVNVGswTFRZdU5qWTNMVEl1TmpZM0xUWXVOalkzWVRZdU5qWTNMRFl1TmpZM0xEQXNNU3d3TERBc01UTXVNek16UXpNM01pNHlNamdzTVRFd0xqQTBOQ3d6TnpNdU5ESXhMREV3Tnk0d05pd3pOek11TkRJeExERXdNeTR6TnpoYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TXpJeExqUXlNU0F0T0RVdU16YzRLU2NnWm1sc2JEMG5KVEl6TnpkaFlXUTBKeThsTTBVbE0wTm5JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0RFMUxqWTJOeUF5TlNrbkpUTkZKVE5EWTJseVkyeGxJR040UFNjeEp5QmplVDBuTVNjZ2NqMG5NU2NnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb01UTXVNek16SURRcEp5Qm1hV3hzUFNjbE1qTmhOV00yWlRNbkx5VXpSU1V6UTJOcGNtTnNaU0JqZUQwbk1TY2dZM2s5SnpFbklISTlKekVuSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtERTNMak16TXlrbklHWnBiR3c5SnlVeU0yRTFZelpsTXljdkpUTkZKVE5EWTJseVkyeGxJR040UFNjeEp5QmplVDBuTVNjZ2NqMG5NU2NnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb01qZ2dNVEl1TmpZM0tTY2dabWxzYkQwbkpUSXpZVFZqTm1Vekp5OGxNMFVsTTBOamFYSmpiR1VnWTNnOUp6RW5JR041UFNjeEp5QnlQU2N4SnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3dJREkwTGpZMk55a25JR1pwYkd3OUp5VXlNMkUxWXpabE15Y3ZKVE5GSlROREwyY2xNMFVsTTBOd1lYUm9JR1E5SjAweE1EZ3VNRGc1TERFMk5DNDVOemgyTVRjdU16TXpZVGd1TmpZM0xEZ3VOalkzTERBc01Td3dMREF0TVRjdU16TXpXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUazFMalF5TWlBdE1UUTFMalkwTlNrbklHWnBiR3c5SnlVeU16UmhPR1JqTmljdkpUTkZKVE5EY0dGMGFDQmtQU2ROTkRjdU5EWTJMREUzTXk0Mk5EUmpNQzAwTGpjNE5pMHlMakE0T1MwNExqWTJOeTAwTGpZMk55MDRMalkyTjJFNExqWTJOeXc0TGpZMk55d3dMREVzTUN3d0xERTNMak16TTBNME5TNHpOemNzTVRneUxqTXhMRFEzTGpRMk5pd3hOemd1TkRNc05EY3VORFkyTERFM015NDJORFJhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RNekF1TVRNeklDMHhORFV1TmpRMEtTY2dabWxzYkQwbkpUSXpOemRoWVdRMEp5OGxNMFVsTTBNdlp5VXpSU1V6UXk5emRtY2xNMFZjSWlrN1hHNWNkR0poWTJ0bmNtOTFibVF0YzJsNlpUcGpiMjUwWVdsdU8xeHVYSFJpWVdOclozSnZkVzVrTFhKbGNHVmhkRHB1YnkxeVpYQmxZWFE3WEc1OVhHNHVjM0JoWTJWemFHbHdJSHRjYmx4MGQybGtkR2c2TXpad2VEdGNibHgwYUdWcFoyaDBPalEyY0hnN1hHNWNkR0poWTJ0bmNtOTFibVF0YVcxaFoyVTZJSFZ5YkNoY0ltUmhkR0U2YVcxaFoyVXZjM1puSzNodGJDd2xNME56ZG1jZ2VHMXNibk05SjJoMGRIQTZMeTkzZDNjdWR6TXViM0puTHpJd01EQXZjM1puSnlCM2FXUjBhRDBuTWpZdU16UXlKeUJvWldsbmFIUTlKek0ySnlCMmFXVjNRbTk0UFNjd0lEQWdNall1TXpReUlETTJKeVV6UlNVelEyY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRFeU15NDFPRE1nTUNrbkpUTkZKVE5EY0dGMGFDQmtQU2ROTVRNMkxqYzFOU3d4TlRBdU1EWXpiQzB4TWk0MU1USXNNVEF1TURGaE1TNDNOVFlzTVM0M05UWXNNQ3d3TERBdExqWTFPU3d4TGpNM01YWTBMalF5Tkd3eE15NHhOekV0TWk0Mk16UXNNVE11TVRjeExESXVOak0wZGkwMExqUXlOR0V4TGpjMU5pd3hMamMxTml3d0xEQXNNQzB1TmpVNUxURXVNemN4V2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVEF1TURBeElDMHhNelV1TVRNM0tTY2dabWxzYkQwbkpUSXpabVkyTkRZMEp5OGxNMFVsTTBOd1lYUm9JR1E5SjAweU1qQXVOakUyTERNeE15NHhNemhzTFRFdU1EUTBMVFF1TVRjM2FDMDJMalkwYkMweExqQTBOQ3cwTGpFM04yRXVPRGM0TGpnM09Dd3dMREFzTUN3dU9EVXlMREV1TURreGFEY3VNREkxWVM0NE56Z3VPRGM0TERBc01Dd3dMQzQ0TlRJdE1TNHdPVEZhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3ROemt1TkRrNElDMHlOemd1TWpNcEp5Qm1hV3hzUFNjbE1qTTVOVGxqWWpNbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRJeE5DNDFNak1zTXpFekxqRXpPR3d4TGpBME5DMDBMakUzTjJndE1pNDJNelJzTFRFdU1EUTBMRFF1TVRjM1lTNDROemd1T0RjNExEQXNNQ3d3TEM0NE5USXNNUzR3T1RGb01pNDJNelJoTGpnM09DNDROemdzTUN3d0xERXRMamcxTWkweExqQTVNVm9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMDNPUzQwT1RnZ0xUSTNPQzR5TXlrbklHWnBiR3c5SnlVeU16Y3dOelE0TnljdkpUTkZKVE5EY0dGMGFDQmtQU2ROTWpBM0xqVTJPUzQwTWprc01qQXpMalE0TERjdU56TTJZVE11TlRFekxETXVOVEV6TERBc01Dd3dMUzQwTkRjc01TNDNNVFZXTXpBdU56TXlZVEV1TnpVMkxERXVOelUyTERBc01Dd3dMREV1TnpVMkxERXVOelUyYURjdU1ESTFZVEV1TnpVMkxERXVOelUyTERBc01Dd3dMREV1TnpVMkxURXVOelUyVmprdU5EVmhNeTQxTVRFc015NDFNVEVzTUN3d0xEQXRMalEwTnkweExqY3hOVXd5TURrdU1ETTBMalF5T1VFdU9ETTVMamd6T1N3d0xEQXNNQ3d5TURjdU5UWTVMalF5T1ZvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzAzTVM0MU5EY2dNQ2tuSUdacGJHdzlKeVV5TTJVMFpXRm1OaWN2SlRORkpUTkRjR0YwYUNCa1BTZE5NakEyTGpVME5Td3pNQzQzT0RGV09TNDFZVGN1TmpVNExEY3VOalU0TERBc01Dd3hMQzR4T0RZdE1TNDNNVFZzTVM0M0xUY3VNekEzWVRFdU1URXhMREV1TVRFeExEQXNNQ3d4TEM0eE5UY3RMak0zTVM0NE16TXVPRE16TERBc01Dd3dMVEV1TURJekxqTTNNVXd5TURNdU5EZ3NOeTQzT0RWaE15NDFNVE1zTXk0MU1UTXNNQ3d3TERBdExqUTBOeXd4TGpjeE5WWXpNQzQzT0RGaE1TNDNOVFlzTVM0M05UWXNNQ3d3TERBc01TNDNOVFlzTVM0M05UWm9NaTQwT0RoRE1qQTJMamczTXl3ek1pNDFNemNzTWpBMkxqVTBOU3d6TVM0M05URXNNakEyTGpVME5Td3pNQzQzT0RGYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TnpFdU5UUTNJQzB3TGpBME9Ta25JR1pwYkd3OUp5VXlNMk0zWTJabE1pY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk1qQTVMakF6TlM0ME0yRXVPRE01TGpnek9Td3dMREFzTUMweExqUTJOQ3d3YkMwMExqQTRPU3czTGpNd04yRXpMalV4TXl3ekxqVXhNeXd3TERBc01DMHVORFEzTERFdU56RTFkalF1Tm1neE1DNDFNemQyTFRRdU5tRXpMalV4TVN3ekxqVXhNU3d3TERBc01DMHVORFEzTFRFdU56RTFXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUY3hMalUwT0NBdE1DNHdNREVwSnlCbWFXeHNQU2NsTWpObVpqWTBOalFuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVEl3Tmk0MU5EWXNPUzQxTVRKaE55NDJOVGdzTnk0Mk5UZ3NNQ3d3TERFc0xqRTROaTB4TGpjeE5Xd3hMamN0Tnk0ek1EZGhNUzR4TVRFc01TNHhNVEVzTUN3d0xERXNMakUxTnkwdU16Y3hMamcyTGpnMkxEQXNNQ3d3TFM0MU5UTXRMakF4TW1NdExqQXhNeXd3TFM0d01qWXVNREV4TFM0d016a3VNREUyWVM0NE1USXVPREV5TERBc01Dd3dMUzR4T1RNdU1UQTJZeTB1TURFNUxqQXhOQzB1TURNNExqQXlOeTB1TURVMkxqQTBNMkV1T0RJeExqZ3lNU3d3TERBc01DMHVNVGd5TGpJeE9Fd3lNRE11TkRneExEY3VPR0V6TGpVeE15d3pMalV4TXl3d0xEQXNNQzB1TkRRM0xERXVOekUxZGpRdU5tZ3pMalV4TWxvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzAzTVM0MU5EZ2dMVEF1TURZeEtTY2dabWxzYkQwbkpUSXpaREkxTlRWaEp5OGxNMFVsTTBOd1lYUm9JR1E5SjAweU1UTXVOVGN4TERFME1TNHlNelZJTWpBekxqQXpOSFl4TGpjMU5tZ3lMakkxTW1FekxqUTJPU3d6TGpRMk9Td3dMREFzTUN3MkxqQXpOQ3d3YURJdU1qVXlkaTB4TGpjMU5sb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MwM01TNDFORGdnTFRFeU55NHhPRGNwSnlCbWFXeHNQU2NsTWpOak4yTm1aVEluTHlVelJTVXpRMk5wY21Oc1pTQmplRDBuTVM0M05UWW5JR041UFNjeExqYzFOaWNnY2owbk1TNDNOVFluSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtERXpOQzQ1T1RrZ01USXVNamt5S1NjZ1ptbHNiRDBuSlRJek5XSTFaRFpsSnk4bE0wVWxNME53WVhSb0lHUTlKMDB5TURZdU5UUTJMREUwTkM0eU5qWjJMVE11TURNeWFDMHpMalV4TW5ZeExqYzFObWd5TGpJMU1rRXpMalUxTVN3ekxqVTFNU3d3TERBc01Dd3lNRFl1TlRRMkxERTBOQzR5TmpaYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TnpFdU5UUTRJQzB4TWpjdU1UZzJLU2NnWm1sc2JEMG5KVEl6WVdaaU9XUXlKeThsTTBVbE0wTndZWFJvSUdROUowMHlNVGt1TmpjM0xqUXlPV3d0TXk0eUxEVXVOekUyYURjdU9EWXpiQzB6TGpJdE5TNDNNVFpCTGpnek9TNDRNemtzTUN3d0xEQXNNakU1TGpZM055NDBNamxhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RPRE11TmpVMUlEQXBKeUJtYVd4c1BTY2xNak0zTURjME9EY25MeVV6UlNVelEzQmhkR2dnWkQwblRUSXhPUzR5TVRFc05pNHlNRFlzTWpJd0xqVTBOQzQwT0RsQk1TNHhNVEVzTVM0eE1URXNNQ3d3TERFc01qSXdMamN1TVRFNFlTNDROaTQ0Tml3d0xEQXNNQzB1TlRVekxTNHdNVEpzTFM0d01URXNNQzB1TURJNExqQXhNV0V1T0RFeUxqZ3hNaXd3TERBc01DMHVNVGt6TGpFd05td3RMakF5TGpBeE5XTXRMakF4TWk0d01Ea3RMakF5TlM0d01UZ3RMakF6Tnk0d01qaGhMamd5TXk0NE1qTXNNQ3d3TERBdExqRTRNaTR5TVRoc0xUTXVNaXcxTGpjeE5tZ3lMamN6TWxvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzA0TXk0Mk5UWWdMVEF1TURZcEp5Qm1hV3hzUFNjbE1qTTFZalZrTm1Vbkx5VXpSU1V6UTJjZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9NVEl6TGpVNE15QXlOUzQwTmpNcEp5VXpSU1V6UTNCaGRHZ2daRDBuVFRFeU15NDFPRFFzTWpZeExqSTJOR3czTGprdE1TNDFPREZXTWpVMmJDMDNMamtzTWk0eE1EZGFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE1USXpMalU0TkNBdE1qVTFMams1TmlrbklHWnBiR3c5SnlVeU0yUXlOVFUxWVNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTXpFMkxqZzNMREkyTVM0eU5qUnNMVGN1T1MweExqVTRNVll5TlRac055NDVMREl1TVRBM1dpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRJNU1DNDFNamNnTFRJMU5TNDVPVFlwSnlCbWFXeHNQU2NsTWpOa01qVTFOV0VuTHlVelJTVXpReTluSlRORkpUTkRaeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNneE1qTXVOVGd6SURJMUxqUTJNeWtuSlRORkpUTkRjR0YwYUNCa1BTZE5NVEkwTGpRMk1pd3lOalF1T0RJMGFEQmhMamczT0M0NE56Z3NNQ3d3TERBdExqZzNPQzQ0TnpoMk55NHdNalZoTGpnM09DNDROemdzTUN3d0xEQXNMamczT0M0NE56aG9NR0V1T0RjNExqZzNPQ3d3TERBc01Dd3VPRGM0TFM0NE56aFdNalkxTGpkQkxqZzNPQzQ0Tnpnc01Dd3dMREFzTVRJMExqUTJNaXd5TmpRdU9ESTBXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xURXlNeTQxT0RRZ0xUSTJNeTQ1TkRZcEp5Qm1hV3hzUFNjbE1qTmhabUk1WkRJbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRFMU9TNDNOek1zTWpVMmFEQmhMamczT0M0NE56Z3NNQ3d3TERBdExqZzNPQzQ0TnpoMk5DNHpPV0V1T0RjNExqZzNPQ3d3TERBc01Dd3VPRGM0TGpnM09HZ3dZUzQ0TnpndU9EYzRMREFzTUN3d0xDNDROemd0TGpnM09IWXROQzR6T1VFdU9EYzRMamczT0N3d0xEQXNNQ3d4TlRrdU56Y3pMREkxTmxvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzB4TlRVdU16Z3pJQzB5TlRVdU9UazJLU2NnWm1sc2JEMG5KVEl6WVdaaU9XUXlKeThsTTBVbE0wTndZWFJvSUdROUowMHpOekV1TmpNNUxESTJOQzQ0TWpSb01HRXVPRGM0TGpnM09Dd3dMREFzTVN3dU9EYzRMamczT0hZM0xqQXlOV0V1T0RjNExqZzNPQ3d3TERBc01TMHVPRGM0TGpnM09HZ3dZUzQ0TnpndU9EYzRMREFzTUN3eExTNDROemd0TGpnM09GWXlOalV1TjBFdU9EYzRMamczT0N3d0xEQXNNU3d6TnpFdU5qTTVMREkyTkM0NE1qUmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE16UTJMakUzTlNBdE1qWXpMamswTmlrbklHWnBiR3c5SnlVeU0yRm1ZamxrTWljdkpUTkZKVE5EY0dGMGFDQmtQU2ROTXpNMkxqTXlPQ3d5TlRab01HRXVPRGM0TGpnM09Dd3dMREFzTVN3dU9EYzRMamczT0hZMExqTTVZUzQ0TnpndU9EYzRMREFzTUN3eExTNDROemd1T0RjNGFEQmhMamczT0M0NE56Z3NNQ3d3TERFdExqZzNPQzB1T0RjNGRpMDBMak01UVM0NE56Z3VPRGM0TERBc01Dd3hMRE16Tmk0ek1qZ3NNalUyV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVE14TkM0ek56WWdMVEkxTlM0NU9UWXBKeUJtYVd4c1BTY2xNak5oWm1JNVpESW5MeVV6UlNVelF5OW5KVE5GSlRORFp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d4TWpNdU5UZ3pJREkxTGpRME5pa25KVE5GSlRORFkybHlZMnhsSUdONFBTY3dMamc1TlNjZ1kzazlKekF1T0RrMUp5QnlQU2N3TGpnNU5TY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTUNBd0xqZzJNaWtuSUdacGJHdzlKeVV5TXprMU9XTmlNeWN2SlRORkpUTkRZMmx5WTJ4bElHTjRQU2N3TGpnNU5TY2dZM2s5SnpBdU9EazFKeUJ5UFNjd0xqZzVOU2NnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb015NDBPVFlwSnlCbWFXeHNQU2NsTWpNNU5UbGpZak1uTHlVelJTVXpRMk5wY21Oc1pTQmplRDBuTUM0NE9UVW5JR041UFNjd0xqZzVOU2NnY2owbk1DNDRPVFVuSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtESTBMalUxTWlBd0xqZzJNaWtuSUdacGJHdzlKeVV5TXprMU9XTmlNeWN2SlRORkpUTkRZMmx5WTJ4bElHTjRQU2N3TGpnNU5TY2dZM2s5SnpBdU9EazFKeUJ5UFNjd0xqZzVOU2NnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb01qRXVNRFUzS1NjZ1ptbHNiRDBuSlRJek9UVTVZMkl6Snk4bE0wVWxNME12WnlVelJTVXpRMmNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb01UTTFMamczTmlBeU15NDNNRGNwSnlVelJTVXpRM0JoZEdnZ1pEMG5UVEkwT0M0d05Td3lORE11TmpBNGFEQmhMamczT0M0NE56Z3NNQ3d3TERBc0xqZzNPQzB1T0RjNGRpMHpMalV4TW1FdU9EYzRMamczT0N3d0xEQXNNQzB1T0RjNExTNDROemhvTUdFdU9EYzRMamczT0N3d0xEQXNNQzB1T0RjNExqZzNPSFl6TGpVeE1rRXVPRGM0TGpnM09Dd3dMREFzTUN3eU5EZ3VNRFVzTWpRekxqWXdPRm9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMHlORGN1TVRjeUlDMHlNemd1TXpRcEp5Qm1hV3hzUFNjbE1qTmpOMk5tWlRJbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRJM05DNDFNelFzTWpRekxqWXdPR2d3WVM0NE56Z3VPRGM0TERBc01Dd3dMQzQ0TnpndExqZzNPSFl0TXk0MU1USmhMamczT0M0NE56Z3NNQ3d3TERBdExqZzNPQzB1T0RjNGFEQmhMamczT0M0NE56Z3NNQ3d3TERBdExqZzNPQzQ0TnpoMk15NDFNVEpCTGpnM09DNDROemdzTUN3d0xEQXNNamMwTGpVek5Dd3lORE11TmpBNFdpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRJM01TNHdNaklnTFRJek9DNHpOQ2tuSUdacGJHdzlKeVV5TTJNM1kyWmxNaWN2SlRORkpUTkRMMmNsTTBVbE0wTndZWFJvSUdROUowMHlNakV1TlRZM0xESTBNeTQyTURob01HRXVPRGM0TGpnM09Dd3dMREFzTUN3dU9EYzRMUzQ0TnpoMkxUTXVOVEV5WVM0NE56Z3VPRGM0TERBc01Dd3dMUzQ0TnpndExqZzNPR2d3WVM0NE56Z3VPRGM0TERBc01Dd3dMUzQ0TnpndU9EYzRkak11TlRFeVFTNDROemd1T0RjNExEQXNNQ3d3TERJeU1TNDFOamNzTWpRekxqWXdPRm9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMDROeTQwTkRjZ0xUSXhOQzQyTXpNcEp5Qm1hV3hzUFNjbE1qTmhabUk1WkRJbkx5VXpSU1V6UXk5bkpUTkZKVE5ETDNOMlp5VXpSVndpS1R0Y2JseDBZbUZqYTJkeWIzVnVaQzF6YVhwbE9tTnZiblJoYVc0N1hHNWNkR0poWTJ0bmNtOTFibVF0Y21Wd1pXRjBPbTV2TFhKbGNHVmhkRHRjYm4xY2JseHVMbUZ6ZEdWeWIybGtMbUZqZEdsMlpTQjdYRzVjZEhkcFpIUm9Pall3Y0hnN1hHNWNkR2hsYVdkb2REbzJNSEI0TzF4dVhIUmlZV05yWjNKdmRXNWtMV2x0WVdkbE9pQjFjbXdvWENKa1lYUmhPbWx0WVdkbEwzTjJaeXQ0Yld3c0pUTkRjM1puSUhodGJHNXpQU2RvZEhSd09pOHZkM2QzTG5jekxtOXlaeTh5TURBd0wzTjJaeWNnZDJsa2RHZzlKelkxSnlCb1pXbG5hSFE5SnpZMEp5QjJhV1YzUW05NFBTY3dJREFnTmpVZ05qUW5KVE5GSlRORFp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TVRBd015QXRORGt3S1NjbE0wVWxNME5qYVhKamJHVWdZM2c5SnpJekxqVW5JR041UFNjeU15NDFKeUJ5UFNjeU15NDFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNneE1EQTVJRFV3TWlrbklHWnBiR3c5SnlVeU0yUXlaVE5tTVNjdkpUTkZKVE5EWTJseVkyeGxJR040UFNjNUp5QmplVDBuT1NjZ2NqMG5PU2NnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb01UQXdPU0ExTURJcEp5Qm1hV3hzUFNjbE1qTmtNbVV6WmpFbkx5VXpSU1V6UTJOcGNtTnNaU0JqZUQwbk1USW5JR041UFNjeE1pY2djajBuTVRJbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLREV3TWpFZ05Ea3dLU2NnWm1sc2JEMG5KVEl6WkRKbE0yWXhKeThsTTBVbE0wTmphWEpqYkdVZ1kzZzlKekV5SnlCamVUMG5NVEluSUhJOUp6RXlKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNneE1ETXpJRFE1T1NrbklHWnBiR3c5SnlVeU0yUXlaVE5tTVNjdkpUTkZKVE5EWTJseVkyeGxJR040UFNjeE1pY2dZM2s5SnpFeUp5QnlQU2N4TWljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9NVEF3TXlBMU1qQXBKeUJtYVd4c1BTY2xNak5rTW1VelpqRW5MeVV6UlNVelEyTnBjbU5zWlNCamVEMG5NVEluSUdONVBTY3hNaWNnY2owbk1USW5JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0RFd016TWdOVE13S1NjZ1ptbHNiRDBuSlRJelpESmxNMll4Snk4bE0wVWxNME5qYVhKamJHVWdZM2c5SnpjdU5TY2dZM2s5SnpjdU5TY2djajBuTnk0MUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d4TURRNElEVXlNeWtuSUdacGJHdzlKeVV5TTJReVpUTm1NU2N2SlRORkpUTkRZMmx5WTJ4bElHTjRQU2MzTGpVbklHTjVQU2MzTGpVbklISTlKemN1TlNjZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9NVEF4TUNBMU1qTXBKeUJtYVd4c1BTY2xNak0wWVRoa1l6WW5MeVV6UlNVelEyTnBjbU5zWlNCamVEMG5OeTQxSnlCamVUMG5OeTQxSnlCeVBTYzNMalVuSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtERXdNVFVnTlRFMEtTY2dabWxzYkQwbkpUSXpOR0U0WkdNMkp5OGxNMFVsTTBOamFYSmpiR1VnWTNnOUp6RTRKeUJqZVQwbk1UZ25JSEk5SnpFNEp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d4TURFNElEVXdOQ2tuSUdacGJHdzlKeVV5TXpSaE9HUmpOaWN2SlRORkpUTkRZMmx5WTJ4bElHTjRQU2MzTGpVbklHTjVQU2MzTGpVbklISTlKemN1TlNjZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9NVEF4TUNBMU1qTXBKeUJtYVd4c1BTY2xNak0wWVRoa1l6WW5MeVV6UlNVelEyTnBjbU5zWlNCamVEMG5OQzQxSnlCamVUMG5OQzQxSnlCeVBTYzBMalVuSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtERXdOVGtnTlRFektTY2dabWxzYkQwbkpUSXpaREpsTTJZeEp5OGxNMFVsTTBOamFYSmpiR1VnWTNnOUp6Y3VOU2NnWTNrOUp6Y3VOU2NnY2owbk55NDFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNneE1ETTJJRFV6TXlrbklHWnBiR3c5SnlVeU16UmhPR1JqTmljdkpUTkZKVE5EWTJseVkyeGxJR040UFNjM0xqVW5JR041UFNjM0xqVW5JSEk5SnpjdU5TY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTVRBeU55QTBPVGtwSnlCbWFXeHNQU2NsTWpNMFlUaGtZelluTHlVelJTVXpRMk5wY21Oc1pTQmplRDBuTnk0MUp5QmplVDBuTnk0MUp5QnlQU2MzTGpVbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLREV3TWpBZ05URTRLU2NnWm1sc2JEMG5KVEl6TnpkaFlXUTBKeThsTTBVbE0wTmphWEpqYkdVZ1kzZzlKemN1TlNjZ1kzazlKemN1TlNjZ2NqMG5OeTQxSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3hNRE16SURVd055a25JR1pwYkd3OUp5VXlNemMzWVdGa05DY3ZKVE5GSlRORFkybHlZMnhsSUdONFBTYzFMalVuSUdONVBTYzFMalVuSUhJOUp6VXVOU2NnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb01UQXpOeUExTWpjcEp5Qm1hV3hzUFNjbE1qTTNOMkZoWkRRbkx5VXpSU1V6UTJOcGNtTnNaU0JqZUQwbk5DY2dZM2s5SnpRbklISTlKelFuSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtERXdNemNnTlRJM0tTY2dabWxzYkQwbkpUSXpabVptSnk4bE0wVWxNME5qYVhKamJHVWdZM2c5SnpRbklHTjVQU2MwSnlCeVBTYzBKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNneE1ESTJJRFV5TUNrbklHWnBiR3c5SnlVeU0yWm1aaWN2SlRORkpUTkRZMmx5WTJ4bElHTjRQU2MwSnlCamVUMG5OQ2NnY2owbk5DY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTVRBME1DQTFNVEVwSnlCbWFXeHNQU2NsTWpObVptWW5MeVV6UlNVelF5OW5KVE5GSlROREwzTjJaeVV6UlZ3aUtUdGNibHgwWW1GamEyZHliM1Z1WkMxemFYcGxPbU52Ym5SaGFXNDdYRzVjZEdKaFkydG5jbTkxYm1RdGNtVndaV0YwT201dkxYSmxjR1ZoZER0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 */";
    	append(document.head, style);
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.selectedSize = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.selectedTheme = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (13:0) {#if debug}
    function create_if_block_1(ctx) {
    	var dl, dt, dd, div2, div0, label0, t2, select0, t3, div1, label1, t5, select1, dispose;

    	var each_value_1 = ctx.availableThemes;

    	var each_blocks_1 = [];

    	for (var i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	var each_value = ctx.availableSize;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			dl = element("dl");
    			dt = element("dt");
    			dt.textContent = "Options";
    			dd = element("dd");
    			div2 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Theme";
    			t2 = space();
    			select0 = element("select");

    			for (var i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t3 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Size";
    			t5 = space();
    			select1 = element("select");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			dt.className = "svelte-1ifa9c2";
    			add_location(dt, file$1, 14, 1, 271);
    			label0.htmlFor = "theme";
    			add_location(label0, file$1, 18, 4, 330);
    			if (ctx.theme === void 0) add_render_callback(() => ctx.select0_change_handler.call(select0));
    			select0.id = "theme";
    			add_location(select0, file$1, 21, 4, 378);
    			div0.className = "svelte-1ifa9c2";
    			add_location(div0, file$1, 17, 3, 320);
    			label1.htmlFor = "size";
    			add_location(label1, file$1, 28, 4, 557);
    			if (ctx.size === void 0) add_render_callback(() => ctx.select1_change_handler.call(select1));
    			select1.id = "size";
    			add_location(select1, file$1, 31, 4, 603);
    			div1.className = "svelte-1ifa9c2";
    			add_location(div1, file$1, 27, 3, 547);
    			div2.id = "JSE-DEBUG";
    			div2.className = "svelte-1ifa9c2";
    			add_location(div2, file$1, 16, 2, 296);
    			dd.className = "svelte-1ifa9c2";
    			add_location(dd, file$1, 15, 1, 289);
    			dl.className = "svelte-1ifa9c2";
    			add_location(dl, file$1, 13, 0, 265);

    			dispose = [
    				listen(select0, "change", ctx.select0_change_handler),
    				listen(select1, "change", ctx.select1_change_handler)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert(target, dl, anchor);
    			append(dl, dt);
    			append(dl, dd);
    			append(dd, div2);
    			append(div2, div0);
    			append(div0, label0);
    			append(div0, t2);
    			append(div0, select0);

    			for (var i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select0, null);
    			}

    			select_option(select0, ctx.theme);

    			append(div2, t3);
    			append(div2, div1);
    			append(div1, label1);
    			append(div1, t5);
    			append(div1, select1);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select1, null);
    			}

    			select_option(select1, ctx.size);
    		},

    		p: function update(changed, ctx) {
    			if (changed.availableThemes) {
    				each_value_1 = ctx.availableThemes;

    				for (var i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(changed, child_ctx);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}
    				each_blocks_1.length = each_value_1.length;
    			}

    			if (changed.theme) select_option(select0, ctx.theme);

    			if (changed.availableSize) {
    				each_value = ctx.availableSize;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.size) select_option(select1, ctx.size);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(dl);
    			}

    			destroy_each(each_blocks_1, detaching);

    			destroy_each(each_blocks, detaching);

    			run_all(dispose);
    		}
    	};
    }

    // (23:5) {#each availableThemes as selectedTheme, i}
    function create_each_block_1(ctx) {
    	var option, t_value = ctx.selectedTheme, t, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.selectedTheme;
    			option.value = option.__value;
    			add_location(option, file$1, 23, 6, 474);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    // (33:5) {#each availableSize as selectedSize, i}
    function create_each_block$1(ctx) {
    	var option, t_value = ctx.selectedSize, t, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.selectedSize;
    			option.value = option.__value;
    			add_location(option, file$1, 33, 6, 694);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    // (68:3) {#if open}
    function create_if_block(ctx) {
    	var div, current;

    	var asteroids = new Asteroids({ $$inline: true });
    	asteroids.$on("complete", ctx.callbackFunction);

    	return {
    		c: function create() {
    			div = element("div");
    			asteroids.$$.fragment.c();
    			div.id = "JSE-captcha-game";
    			div.className = "svelte-1ifa9c2";
    			add_location(div, file$1, 68, 4, 3695);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(asteroids, div, null);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			asteroids.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			asteroids.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			asteroids.$destroy();
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	var t0, section, details, summary, div0, input, t1, div1, p, t2, div2, svg, g5, path0, path1, path2, g0, path3, g2, g1, path4, g4, g3, path5, t3, div4, div3, section_class_value, current, dispose;

    	var if_block0 = (ctx.debug) && create_if_block_1(ctx);

    	var if_block1 = (ctx.open) && create_if_block(ctx);

    	return {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			section = element("section");
    			details = element("details");
    			summary = element("summary");
    			div0 = element("div");
    			input = element("input");
    			t1 = space();
    			div1 = element("div");
    			p = element("p");
    			t2 = space();
    			div2 = element("div");
    			svg = svg_element("svg");
    			g5 = svg_element("g");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			g0 = svg_element("g");
    			path3 = svg_element("path");
    			g2 = svg_element("g");
    			g1 = svg_element("g");
    			path4 = svg_element("path");
    			g4 = svg_element("g");
    			g3 = svg_element("g");
    			path5 = svg_element("path");
    			t3 = space();
    			div4 = element("div");
    			div3 = element("div");
    			if (if_block1) if_block1.c();
    			input.id = "captchaCheck";
    			attr(input, "type", "checkbox");
    			input.className = "svelte-1ifa9c2";
    			add_location(input, file$1, 48, 4, 1069);
    			div0.id = "JSE-input";
    			div0.className = "svelte-1ifa9c2";
    			add_location(div0, file$1, 47, 3, 1044);
    			p.className = "svelte-1ifa9c2";
    			add_location(p, file$1, 54, 4, 1234);
    			div1.id = "JSE-msg";
    			div1.className = "svelte-1ifa9c2";
    			add_location(div1, file$1, 53, 3, 1211);
    			attr(path0, "d", "M55.84,406.929,55.8,418.9a7.144,7.144,0,0,0,3.536,6.128l10.471,6a7.15,7.15,0,0,0,7.007.016l10.543-6.087a7.039,7.039,0,0,0,3.528-6.1l.04-11.972a7.143,7.143,0,0,0-3.536-6.127l-10.471-6a7.15,7.15,0,0,0-7.007-.016l-10.543,6.079A7.043,7.043,0,0,0,55.84,406.929Zm17.519-6.943,11.189,6.523-.008,12.844L73.407,425.78l-11.133-6.418-.057-12.949Z");
    			attr(path0, "transform", "translate(-55.8 -362.045)");
    			attr(path0, "fill", "#51bfec");
    			attr(path0, "class", "svelte-1ifa9c2");
    			add_location(path0, file$1, 59, 119, 1415);
    			attr(path1, "d", "M509.74,407.229,509.7,419.2a7.144,7.144,0,0,0,3.536,6.128l10.471,6a7.15,7.15,0,0,0,7.008.016l10.543-6.087a7.039,7.039,0,0,0,3.528-6.1l.04-11.972a7.144,7.144,0,0,0-3.536-6.128l-10.471-6a7.15,7.15,0,0,0-7.007-.016l-10.544,6.087A7.063,7.063,0,0,0,509.74,407.229Zm17.519-6.935,11.189,6.523-.008,12.844-11.133,6.426-11.125-6.418-.057-12.949Z");
    			attr(path1, "transform", "translate(-473.056 -362.321)");
    			attr(path1, "fill", "#51bfec");
    			attr(path1, "class", "svelte-1ifa9c2");
    			add_location(path1, file$1, 59, 519, 1815);
    			attr(path2, "d", "M282.54,13.129,282.5,25.1a7.144,7.144,0,0,0,3.536,6.127l10.471,6a7.15,7.15,0,0,0,7.007.016l10.543-6.087a7.039,7.039,0,0,0,3.528-6.1l.04-11.972a7.144,7.144,0,0,0-3.536-6.127l-10.471-6a7.15,7.15,0,0,0-7.007-.016L286.068,7.034A7.03,7.03,0,0,0,282.54,13.129Zm17.511-6.935,11.189,6.515-.008,12.844L300.1,31.98l-11.125-6.418-.056-12.941Z");
    			attr(path2, "transform", "translate(-264.198 -0.037)");
    			attr(path2, "fill", "#51bfec");
    			attr(path2, "class", "svelte-1ifa9c2");
    			add_location(path2, file$1, 59, 923, 2219);
    			attr(path3, "d", "M411,817.273a26.851,26.851,0,0,1-13.781-.008,1.214,1.214,0,0,0-.646,2.341,29.5,29.5,0,0,0,15.064.008,1.239,1.239,0,0,0,.848-1.494,1.226,1.226,0,0,0-1.485-.848Z");
    			attr(path3, "transform", "translate(-395.688 -817.227)");
    			attr(path3, "fill", "#51bfec");
    			attr(path3, "class", "svelte-1ifa9c2");
    			add_location(path3, file$1, 59, 1359, 2655);
    			attr(g0, "transform", "translate(27.44 65.973)");
    			attr(g0, "class", "svelte-1ifa9c2");
    			add_location(g0, file$1, 59, 1320, 2616);
    			attr(path4, "d", "M154.1,254.1a26.8,26.8,0,0,1,6.9-11.948,1.21,1.21,0,1,0-1.712-1.712,29.257,29.257,0,0,0-7.524,13.014,1.21,1.21,0,1,0,2.333.646Z");
    			attr(path4, "transform", "translate(-151.727 -240.087)");
    			attr(path4, "fill", "#51bfec");
    			attr(path4, "class", "svelte-1ifa9c2");
    			add_location(path4, file$1, 59, 1656, 2952);
    			attr(g1, "transform", "translate(0)");
    			attr(g1, "class", "svelte-1ifa9c2");
    			add_location(g1, file$1, 59, 1628, 2924);
    			attr(g2, "transform", "translate(7.744 19.38)");
    			attr(g2, "class", "svelte-1ifa9c2");
    			add_location(g2, file$1, 59, 1590, 2886);
    			attr(path5, "d", "M729.4,241.99a26.72,26.72,0,0,1,6.9,11.948,1.214,1.214,0,1,0,2.341-.646,29.3,29.3,0,0,0-7.532-13.022,1.213,1.213,0,0,0-1.711,1.72Z");
    			attr(path5, "transform", "translate(-729.05 -239.925)");
    			attr(path5, "fill", "#51bfec");
    			attr(path5, "class", "svelte-1ifa9c2");
    			add_location(path5, file$1, 59, 1927, 3223);
    			attr(g3, "transform", "translate(0)");
    			attr(g3, "class", "svelte-1ifa9c2");
    			add_location(g3, file$1, 59, 1899, 3195);
    			attr(g4, "transform", "translate(54.352 19.366)");
    			attr(g4, "class", "svelte-1ifa9c2");
    			add_location(g4, file$1, 59, 1859, 3155);
    			attr(g5, "transform", "translate(0)");
    			attr(g5, "class", "svelte-1ifa9c2");
    			add_location(g5, file$1, 59, 91, 1387);
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "viewBox", "0 0 71.771 69.931");
    			attr(svg, "class", "svelte-1ifa9c2");
    			add_location(svg, file$1, 59, 23, 1319);
    			div2.id = "JSE-brand";
    			div2.className = "svelte-1ifa9c2";
    			add_location(div2, file$1, 59, 3, 1299);
    			summary.className = "svelte-1ifa9c2";
    			add_location(summary, file$1, 45, 2, 1000);
    			div3.id = "JSE-captcha-game-container";
    			div3.className = "svelte-1ifa9c2";
    			add_location(div3, file$1, 66, 3, 3566);
    			div4.id = "JSE-CaptchaDisplay";
    			div4.className = "svelte-1ifa9c2";
    			add_location(div4, file$1, 65, 2, 3533);
    			details.className = "captchaPanel svelte-1ifa9c2";
    			details.open = true;
    			add_location(details, file$1, 43, 1, 927);
    			section.id = "JSE-Captcha";
    			section.className = section_class_value = "" + ctx.theme + " " + ctx.size + " svelte-1ifa9c2";
    			toggle_class(section, "active", ctx.showCaptcha);
    			toggle_class(section, "success", ctx.complete);
    			toggle_class(section, "thinking", ctx.thinking);
    			add_location(section, file$1, 42, 0, 792);

    			dispose = [
    				listen(input, "change", ctx.input_change_handler),
    				listen(div3, "mousemove", ctx.handleMovement),
    				listen(div3, "touchmove", ctx.handleMovement, { passive: true }),
    				listen(details, "toggle", ctx.details_toggle_handler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert(target, t0, anchor);
    			insert(target, section, anchor);
    			append(section, details);
    			append(details, summary);
    			append(summary, div0);
    			append(div0, input);

    			input.checked = ctx.captchaCheck;

    			append(summary, t1);
    			append(summary, div1);
    			append(div1, p);
    			append(summary, t2);
    			append(summary, div2);
    			append(div2, svg);
    			append(svg, g5);
    			append(g5, path0);
    			append(g5, path1);
    			append(g5, path2);
    			append(g5, g0);
    			append(g0, path3);
    			append(g5, g2);
    			append(g2, g1);
    			append(g1, path4);
    			append(g5, g4);
    			append(g4, g3);
    			append(g3, path5);
    			append(details, t3);
    			append(details, div4);
    			append(div4, div3);
    			if (if_block1) if_block1.m(div3, null);

    			details.open = ctx.open;

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.debug) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (changed.captchaCheck) input.checked = ctx.captchaCheck;

    			if (ctx.open) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    					if_block1.i(1);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.i(1);
    					if_block1.m(div3, null);
    				}
    			} else if (if_block1) {
    				group_outros();
    				on_outro(() => {
    					if_block1.d(1);
    					if_block1 = null;
    				});

    				if_block1.o(1);
    				check_outros();
    			}

    			if (changed.open) details.open = ctx.open;

    			if ((!current || changed.theme || changed.size) && section_class_value !== (section_class_value = "" + ctx.theme + " " + ctx.size + " svelte-1ifa9c2")) {
    				section.className = section_class_value;
    			}

    			if ((changed.theme || changed.size || changed.showCaptcha)) {
    				toggle_class(section, "active", ctx.showCaptcha);
    			}

    			if ((changed.theme || changed.size || changed.complete)) {
    				toggle_class(section, "success", ctx.complete);
    			}

    			if ((changed.theme || changed.size || changed.thinking)) {
    				toggle_class(section, "thinking", ctx.thinking);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			if (if_block1) if_block1.i();
    			current = true;
    		},

    		o: function outro(local) {
    			if (if_block1) if_block1.o();
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);

    			if (detaching) {
    				detach(t0);
    				detach(section);
    			}

    			if (if_block1) if_block1.d();
    			run_all(dispose);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	

    	//Props
    	let { size = 'L', debug = false, theme = 'flat', captchaServer = 'https://load.jsecoin.com' } = $$props;

    	//Events
    	const dispatch = createEventDispatcher();

    	//Init captcha
    	let open = false;
    	let showCaptcha = false;
    	let captchaCheck = false;
    	let thinking = false;
    	let complete = false;

    	const availableThemes = [
    		'default',
    		'flat',
    	];
    	const availableSize = [
    		'S',
    		'M',
    		'L',
    	];

    	setTimeout(() => {
    		$$invalidate('showCaptcha', showCaptcha = true);
    	}, 10);

    	//Mounted
    	onMount(() => {
    	});

    	//Success
    	dispatch('success', 'success event sent');

    	//Methods
    	/**
         * requestURL
         * @param {object} request
         * @param {string} request.method The HTTP method to use for the request.
         * @param {string} request.url The URL for the request
         * @param {string} request.content The body content for the request. May be a string or an ArrayBuffer (for binary data).
         * @param {object} request.headers An object describing headers to apply to the request { [key: string]: string }
         * @param {string} request.responseType The XMLHttpRequestResponseType to apply to the request.
         * @param {boolean} request.abortSignal An AbortSignal that can be monitored for cancellation.
         * @param {string} request.timeout The time to wait for the request to complete before throwing a TimeoutError. Measured in milliseconds.
         */
        const requestURL = (request) => {
            return new Promise ((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.open(request.method, request.url, true);
                //xhr.withCredentials = true;
                xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

                //set headers
                if (request.headers) {
                    Object.keys(request.headers)
                        .forEach((header) => xhr.setRequestHeader(header, request.headers[header]));
                }

                //set response type
                if (request.responseType) {
                    xhr.responseType = request.responseType;
                }

                //abort req
                if (request.abortSignal) {
                    request.abortSignal.onabort = () => {
                        xhr.abort();
                    };
                }

                //timeout time
                if (request.timeout) {
                    xhr.timeout = request.timeout;
                }

                //on state change
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4) {
                        if (request.abortSignal) {
                            request.abortSignal.onabort = null;
                        }

                        // Some browsers report xhr.status == 0 when the
                        // response has been cut off or there's been a TCP FIN.
                        // Treat it like a 200 with no response.
                        if (xhr.status === 0) {
                            resolve({
                                statusCode: 200, 
                                statusText: xhr.statusText || null, 
                                content: xhr.response || xhr.responseText || null,
                            });
                        } else if (xhr.status >= 200 && xhr.status < 300) {
                            resolve({
                                statusCode: xhr.status, 
                                statusText: xhr.statusText, 
                                content: xhr.response || xhr.responseText,
                            });
                        } else {
                            reject({
                                errorMessage: xhr.statusText, 
                                statusCode: xhr.status,
                            });
                        }
                    }
                };

                //catch errors
                xhr.onerror = () => {
                    reject({
                        errorMessage: xhr.statusText, 
                        statusCode: xhr.status
                    });
                };

                //timeout
                xhr.ontimeout = () => {
                    reject({
                        errorMessage: 'A timeout occurred', 
                        statusCode: 'timeout',
                    });
                };

                //init req
                xhr.send(request.content || '');
            });
    	};

    	//Data
     	const mlData = {
    		loadTime: new Date().getTime(),
    		tickTime: 0,
    		finishTime: 0,
    		mouseX: 0,
    		mouseY: 0,
    		mouseUp: 0,
    		mouseDown: 0,
    		mouseLeft: 0,
    		mouseRight: 0,
    		mouseClicks: 0,
    		mouseEvents: 0,
    		mousePattern: [],
    		gamesCompleted: 0,
    		checkBox: 0
    	};

    	mlData.url = window.location.href;	mlData.userAgent = navigator.userAgent || 0;	mlData.platform = navigator.platform || 0;	mlData.referrer = document.referrer || 0;	mlData.runOnce = window.JSERunOnce || false;	mlData.language = window.navigator.language || 0;
    	if (navigator.languages) { 
    		mlData.languages = navigator.languages.join('') || 0;	} else {
    		mlData.languages = 1;	}

    	mlData.timezoneOffset = new Date().getTimezoneOffset() || 0;	mlData.appName = window.navigator.appName || 0;	mlData.screenWidth = window.screen.width || 0;	mlData.screenHeight = window.screen.height || 0;	mlData.screenDepth = window.screen.colorDepth || 0;	mlData.screen = mlData.screenWidth+'x'+mlData.screenHeight+'x'+mlData.screenDepth;	mlData.innerWidth = window.innerWidth || 0;	mlData.innerHeight = window.innerHeight || 0;	mlData.deviceMemory = navigator.deviceMemory || navigator.hardwareConcurrency || 0;	mlData.protoString = Object.keys(navigator.__proto__).join('').substring(0, 100) || 0;
    	if (window.frameElement === null) {
    		mlData.iFrame = false;	} else {
    		mlData.iFrame = true;	}

    	//track movement
    	const handleMovement = (e) => {
    		const rect = e.currentTarget.getBoundingClientRect();
    		if (e.pageX === null) {
    			const eDoc = (e.target && e.target.ownerDocument) || document;
    			const doc = eDoc.documentElement;
    			const body = eDoc.body;
    			e.pageX = Math.floor((e.touches && e.touches[0].clientX || e.clientX || 0) +
    				(doc && doc.scrollLeft || body && body.scrollLeft || 0) -
    				(doc && doc.clientLeft || body && body.clientLeft || 0));
    			e.pageY = Math.floor((e.touches && e.touches[0].clientY || e.clientY || 0) +
    				(doc && doc.scrollTop || body && body.scrollTop || 0) -
    				(doc && doc.clientTop || body && body.clientTop || 0));
    		}
    		const mouseX = e.pageX - rect.left;
    		const mouseY = e.pageY - rect.top;

    		mlData.mouseEvents += 1;		if (mouseY < mlData.mouseY) { mlData.mouseDown += 1; }
    		if (mouseY > mlData.mouseY) { mlData.mouseUp += 1; }
    		if (mouseX > mlData.mouseX) { mlData.mouseRight += 1; }
    		if (mouseX < mlData.mouseX) { mlData.mouseLeft += 1; }

    		mlData.mouseX = mouseX;		mlData.mouseY = mouseY;		mlData.mousePattern.push(parseInt(mouseX) + 'x' + parseInt(mouseY));
    	};
    	
    	const callbackFunction = (e) => {
    		console.log('complete');
    		mlData.gamesCompleted += 1;		mlData.mouseClicks = e.detail.mouseClicks;		mlData.finishTime = e.detail.finishTime;		
    		//close captcha
    		$$invalidate('open', open = false);

    		//submit data
    		submitMLData(
    			(res) => {
    				const JSECaptchaPass = {};
    				JSECaptchaPass.ip = res.ip;
    				JSECaptchaPass.rating = res.rating;
    				JSECaptchaPass.pass = res.pass;
    				
    				dispatch('success', JSECaptchaPass);
    				$$invalidate('complete', complete = true);
    			}, 
    			(res) => {
    				$$invalidate('open', open = true);
    				dispatch('fail', 1);
    			}
    		);
    	};


    	/**
    	 * submitMLData
    	 * submit data with callback code succes fail
         * @param {callback} passCallback Callback function
         * @param {callback} failCallback Callback function
    	 */
    	const submitMLData = (passCallback, failCallback) => {
    		const cleanDataString = prepMLData();
    		$$invalidate('thinking', thinking = true);
    		requestURL({
                method: 'post',
    			url: `${captchaServer}/captcha/request/`,
    			content: cleanDataString,
    			headers: {
    				'Content-Type': 'application/json',
    			},
            //success
            }).then((res) => {
    			console.log('[res][loadConf]',res);
    			$$invalidate('thinking', thinking = false);
    			res = JSON.parse(res.content);
    			if ((res.pass) && (res.pass === true)) {
    				passCallback(res);
    			} else {
    				failCallback(res);
    			}
            //error
            }).catch((err) => {
    			console.error(err);
    			failCallback(res);
    		});
    	};

    	/**
    	 * prepMLData
    	 * Prepare ML data
    	 */
    	const prepMLData = () => {
    		const cleanData = mlData;
    		cleanData.mousePattern = cleanData.mousePattern.slice(cleanData.mousePattern.length-200,cleanData.mousePattern.length);
    		return JSON.stringify({mlData: cleanData});
    	};

    	const writable_props = ['size', 'debug', 'theme', 'captchaServer'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<JSECaptcha> was created with unknown prop '${key}'`);
    	});

    	function select0_change_handler() {
    		theme = select_value(this);
    		$$invalidate('theme', theme);
    		$$invalidate('availableThemes', availableThemes);
    	}

    	function select1_change_handler() {
    		size = select_value(this);
    		$$invalidate('size', size);
    		$$invalidate('availableSize', availableSize);
    	}

    	function input_change_handler() {
    		captchaCheck = this.checked;
    		$$invalidate('captchaCheck', captchaCheck);
    	}

    	function details_toggle_handler() {
    		open = this.open;
    		$$invalidate('open', open);
    	}

    	$$self.$set = $$props => {
    		if ('size' in $$props) $$invalidate('size', size = $$props.size);
    		if ('debug' in $$props) $$invalidate('debug', debug = $$props.debug);
    		if ('theme' in $$props) $$invalidate('theme', theme = $$props.theme);
    		if ('captchaServer' in $$props) $$invalidate('captchaServer', captchaServer = $$props.captchaServer);
    	};

    	$$self.$$.update = ($$dirty = { open: 1, captchaCheck: 1 }) => {
    		if ($$dirty.open) { if (open) {
    				$$invalidate('complete', complete = false);
    			} }
    		if ($$dirty.open) { if (open) {
    				mlData.tickTime = new Date().getTime();			} }
    		if ($$dirty.captchaCheck) { mlData.checkBox = (captchaCheck)?1:0; }
    	};

    	return {
    		size,
    		debug,
    		theme,
    		captchaServer,
    		open,
    		showCaptcha,
    		captchaCheck,
    		thinking,
    		complete,
    		availableThemes,
    		availableSize,
    		handleMovement,
    		callbackFunction,
    		select0_change_handler,
    		select1_change_handler,
    		input_change_handler,
    		details_toggle_handler
    	};
    }

    class JSECaptcha extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-1ifa9c2-style")) add_css();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["size", "debug", "theme", "captchaServer"]);
    	}

    	get size() {
    		throw new Error("<JSECaptcha>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<JSECaptcha>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get debug() {
    		throw new Error("<JSECaptcha>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set debug(value) {
    		throw new Error("<JSECaptcha>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get theme() {
    		throw new Error("<JSECaptcha>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theme(value) {
    		throw new Error("<JSECaptcha>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get captchaServer() {
    		throw new Error("<JSECaptcha>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set captchaServer(value) {
    		throw new Error("<JSECaptcha>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.5.1 */

    const file$2 = "src\\App.svelte";

    function add_css$1() {
    	var style = element("style");
    	style.id = 'svelte-1sh0mdd-style';
    	style.textContent = "#JSE-CaptchaWrapper.svelte-1sh0mdd{margin:10px}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXBwLnN2ZWx0ZSIsInNvdXJjZXMiOlsiQXBwLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQgSlNFY2FwdGNoYSBmcm9tICcuL2NvbXBvbmVudHMvY29tcG9uZW50cy5tb2R1bGUuanMnO1xuPC9zY3JpcHQ+XG5cbjxkaXYgaWQ9XCJKU0UtQ2FwdGNoYVdyYXBwZXJcIj5cbiAgPEpTRWNhcHRjaGEgdGhlbWU9XCJmbGF0XCIgc2l6ZT1cIk1cIiBkZWJ1Zz1cInt0cnVlfVwiIG9uOnN1Y2Nlc3M9eygpID0+IGNvbnNvbGUubG9nKCdPbiBzdWNjZXNzIScpfSBvbjpmYWlsPXsoKSA9PiBjb25zb2xlLmxvZygnT24gZmFpbCEnKX0gLz5cbjwvZGl2PlxuXG48c3R5bGU+XG4jSlNFLUNhcHRjaGFXcmFwcGVyIHtcbiAgbWFyZ2luOjEwcHg7XG59XG5cbi8qIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbk55WXk5QmNIQXVjM1psYkhSbElsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN1FVRkRRVHRGUVVORkxGZEJRVmM3UVVGRFlpSXNJbVpwYkdVaU9pSnpjbU12UVhCd0xuTjJaV3gwWlNJc0luTnZkWEpqWlhORGIyNTBaVzUwSWpwYklseHVJMHBUUlMxRFlYQjBZMmhoVjNKaGNIQmxjaUI3WEc0Z0lHMWhjbWRwYmpveE1IQjRPMXh1ZlZ4dUlsMTkgKi88L3N0eWxlPiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFTQSxtQkFBbUIsZUFBQyxDQUFDLEFBQ25CLE9BQU8sSUFBSSxBQUNiLENBQUMifQ== */";
    	append(document.head, style);
    }

    function create_fragment$2(ctx) {
    	var div, current;

    	var jsecaptcha = new JSECaptcha({
    		props: {
    		theme: "flat",
    		size: "M",
    		debug: true
    	},
    		$$inline: true
    	});
    	jsecaptcha.$on("success", success_handler);
    	jsecaptcha.$on("fail", fail_handler);

    	return {
    		c: function create() {
    			div = element("div");
    			jsecaptcha.$$.fragment.c();
    			div.id = "JSE-CaptchaWrapper";
    			div.className = "svelte-1sh0mdd";
    			add_location(div, file$2, 4, 0, 82);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(jsecaptcha, div, null);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			jsecaptcha.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			jsecaptcha.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			jsecaptcha.$destroy();
    		}
    	};
    }

    function success_handler() {
    	return console.log('On success!');
    }

    function fail_handler() {
    	return console.log('On fail!');
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-1sh0mdd-style")) add_css$1();
    		init(this, options, null, create_fragment$2, safe_not_equal, []);
    	}
    }

    const app = new App({
      // eslint-disable-next-line no-undef
      target: document.body,
      props: {}
    });

    return app;

}());
//# sourceMappingURL=jsecaptcha.iife.js.map
