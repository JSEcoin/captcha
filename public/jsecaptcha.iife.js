
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
    			toggle_class(div, "active", ctx.ele.smashed);
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
    				toggle_class(div, "active", ctx.ele.smashed);
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

    const spaceShipIco = 'data:image/png;base64,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';

    const asteroidSource = '';

    const asteroidFlame = 'data:image/png;base64,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';

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
    			src: spaceShipIco,
    			x: 20,
    			y: 130,
    			r: 45,
    			type: 'spaceShip',
    		},{
    			src: asteroidSource,
    			x: 230,
    			y: 20,
    			r: 0,
    			type: 'asteroid',
    			smashed: false,
    		},{
    			src: asteroidSource,
    			x: 230,
    			y: 120,
    			r: 0,
    			type: 'asteroid',
    			smashed: false,
    		},{
    			src: asteroidSource,
    			x: 130,
    			y: 70,
    			r: 0,
    			type: 'asteroid',
    			smashed: false,
    		}];

    	//smash android
    	const smash = (i) => {
    		gameElement[i].smashed = true; $$invalidate('gameElement', gameElement);
    		gameElement[i].src = asteroidFlame; $$invalidate('gameElement', gameElement);
    		
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
    	style.id = 'svelte-e99oh1-style';
    	style.textContent = "#JSE-Captcha.flat{background:none;padding:0px}#JSE-Captcha.flat details{box-shadow:0px 0px 0px 4px rgba(0, 0, 0, 0.06)}#JSE-Captcha.S{border-radius:6px;padding:8px;margin:5px;font-size:11px}#JSE-Captcha.S #JSE-input{height:20px;min-width:20px;font-size:15px;border:solid 1px #D3D8DD;padding:1px;margin:6px}#JSE-Captcha.S #JSE-brand{width:30px;height:38px;border-left:solid 2px #F9F9F9}#JSE-Captcha.S #JSE-brand svg{width:24px}#JSE-Captcha.S.flat details{box-shadow:0px 0px 0px 2px rgba(0, 0, 0, 0.06)}#JSE-Captcha.S.success #JSE-input{min-width:52px}#JSE-Captcha.M{border-radius:6px;padding:8px;margin:5px;font-size:16px}#JSE-Captcha.M #JSE-input{height:30px;min-width:30px;font-size:20px;border:solid 2px #D3D8DD;margin:8px}#JSE-Captcha.M #JSE-brand{width:38px;border-left:solid 2px #F9F9F9;height:50px}#JSE-Captcha.M #JSE-brand svg{width:34px}#JSE-Captcha.M.flat details{box-shadow:0px 0px 0px 2px rgba(0, 0, 0, 0.06)}#JSE-Captcha.M.success #JSE-input{min-width:70px}#JSE-Captcha.L{}#JSE-Captcha.success #JSE-input{min-width:92px}#JSE-Captcha #JSE-brand{height:68px\n}#captchaCheck{display:none}#JSE-Captcha{display:none;background:#F2F8FF;border-radius:6px;clear:both;padding:13px;margin:10px;min-width:200px;max-width:314px;color:#707070;font-size:20px;font-family:'Montserrat', sans-serif}#JSE-Captcha *{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}#JSE-Captcha details{overflow:hidden;margin:0px;background:#fff;border-radius:4px;box-shadow:0px 3px 6px 0px rgba(0, 0, 0, 0.12)}#JSE-Captcha details summary{display:flex;outline:none}#JSE-Captcha details #JSE-CaptchaDisplay{opacity:0;margin:0px;padding:0px;height:0px;transition:opacity 0.2s, height 0.4s;background:#fff}#JSE-Captcha details.captchaPanel[open] #JSE-CaptchaDisplay{-webkit-animation-name:svelte-e99oh1-slideDown;animation-name:svelte-e99oh1-slideDown;-webkit-animation-duration:0.3s;animation-duration:0.3s;-webkit-animation-fill-mode:forwards;animation-fill-mode:forwards;-webkit-animation-delay:0.3s;animation-delay:0.3s}#JSE-Captcha #JSE-input{border:solid 4px #D3D8DD;border-radius:4px;margin:10px;min-width:40px;height:40px;cursor:pointer;font-size:28px;text-align:center;position:relative;overflow:hidden}#JSE-Captcha details>summary::-webkit-details-marker{display:none}#JSE-Captcha details #JSE-input:hover:before{content:'🤖';opacity:1}#JSE-Captcha.success details #JSE-input:before{content:'😉';opacity:1}#JSE-Captcha.failed details #JSE-input:before{content:'🤖';opacity:1}#JSE-Captcha.thinking details #JSE-input:before{content:'🤡';opacity:1}#JSE-Captcha.success details #JSE-input:after{content:'✔';opacity:1;color:#26AE60;padding:0px 4px 0px 5px;border-left:solid 2px #D3D8DD}#JSE-Captcha.failed details #JSE-input:after{content:'⛔';opacity:1;padding:0px;border-left:solid 2px #D3D8DD}#JSE-Captcha.success details.captchaPanel[open] #JSE-input:after{content:'';opacity:0;padding:0px;border:0px}#JSE-Captcha details #JSE-input:before,#JSE-Captcha details.captchaPanel[open] #JSE-input:before{opacity:0;content:'🤖';transition:opacity 0.2s;position:absolute;top:0px;left:0px;bottom:0px;right:0px;background:#fff}#JSE-Captcha.success details.captchaPanel #JSE-input:before{right:50%}#JSE-Captcha.success details.captchaPanel[open] #JSE-input:after{display:none}#JSE-Captcha.success details.captchaPanel #JSE-input:after{left:50%;position:absolute;top:0px;bottom:0px;right:0px;background:#fff}#JSE-Captcha.success #JSE-input{min-width:92px}#JSE-Captcha.success details.captchaPanel[open] #JSE-input{min-width:20px}#JSE-Captcha details.captchaPanel[open] #JSE-input:before{opacity:1}#JSE-Captcha #JSE-msg{align-self:center;padding:0px 0px 0px 4px;flex:1}#JSE-Captcha #JSE-msg p{vertical-align:bottom;display:inline-block;margin:0px;line-height:1.2}#JSE-Captcha #JSE-brand{border-left:solid 3px #F9F9F9;align-self:center;width:60px;height:68px;padding:0px 4px;text-align:center;display:flex;justify-content:center;align-content:center}#JSE-Captcha #JSE-brand svg{fill:#51BFEC;width:48px}#JSE-Captcha #JSE-CaptchaDisplay #JSE-captcha-game-container{background:#F2F8FF;border-radius:6px;height:100%;position:relative;overflow:hidden}#JSE-Captcha #JSE-CaptchaDisplay #JSE-captcha-game{height:100%}@-webkit-keyframes svelte-e99oh1-slideDown{:global(from){opacity:0;height:0;padding:8px;border-top:solid 4px #F9F9F9}:global(to){opacity:1;height:190px;padding:8px;border-top:solid 4px #F9F9F9}}@keyframes svelte-e99oh1-slideDown{from{opacity:0;height:0;padding:8px;border-top:solid 4px #F9F9F9}to{opacity:1;height:190px;padding:8px;border-top:solid 4px #F9F9F9}}#JSE-Captcha details #JSE-msg>p:after{content:'Im human'}#JSE-Captcha details.captchaPanel[open] #JSE-msg>p:after,#JSE-Captcha.success details.captchaPanel[open] #JSE-msg>p:after{content:'Im not a robot'}#JSE-Captcha.success details #JSE-msg>p:after{content:'Verified human'}#JSE-Captcha.failed details #JSE-msg>p:after{content:'Failed verification'}#JSE-Captcha.thinking details #JSE-msg>p:after{content:'Verifying ...'}#JSE-input input[type=\"checkbox\"]{}#JSE-Captcha.active{display:block}.gfx{position:absolute;opacity:1;transition:opacity 0.6s}.gfx.active{opacity:0}.game{height:100%;background-size:350px;background-repeat:no-repeat;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='254.732' height='142.65' viewBox='0 0 254.732 142.65'%3E%3Crect width='254.732' height='142.65' fill='%2326136e'/%3E%3Cg transform='translate(13.799 8.326)'%3E%3Cg transform='translate(66.725 16.157)'%3E%3Cpath d='M600.042,261.883A46.842,46.842,0,1,0,553.2,215.042a46.93,46.93,0,0,0,46.842,46.842Z' transform='translate(-553.2 -168.2)' fill='%23331178' fill-rule='evenodd'/%3E%3Cpath d='M637.039,292.578A40.539,40.539,0,1,0,596.5,252.039a40.616,40.616,0,0,0,40.539,40.539Z' transform='translate(-590.197 -205.197)' fill='%233a1580' fill-rule='evenodd'/%3E%3Cpath d='M694.542,340.285A30.743,30.743,0,1,0,663.8,309.543a30.807,30.807,0,0,0,30.742,30.743Z' transform='translate(-647.701 -262.701)' fill='%2344158f' fill-rule='evenodd'/%3E%3Cpath d='M751.534,387.567A21.034,21.034,0,1,0,730.5,366.534a21.072,21.072,0,0,0,21.034,21.034Z' transform='translate(-704.692 -319.692)' fill='%23521b96' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(0)'%3E%3Cpath d='M112.413,92.411A17.606,17.606,0,1,0,94.8,74.8a17.643,17.643,0,0,0,17.613,17.613Z' transform='translate(-94.8 -57.2)' fill='%23341270' fill-rule='evenodd'/%3E%3Cpath d='M126.34,103.966a15.233,15.233,0,1,0-15.24-15.24,15.26,15.26,0,0,0,15.24,15.24Z' transform='translate(-108.727 -71.127)' fill='%233d1273' fill-rule='evenodd'/%3E%3Cpath d='M147.958,121.9A11.55,11.55,0,1,0,136.4,110.343,11.573,11.573,0,0,0,147.958,121.9Z' transform='translate(-130.345 -92.745)' fill='%23491279' fill-rule='evenodd'/%3E%3Cpath d='M169.4,139.608a7.9,7.9,0,1,0-7.9-7.9,7.921,7.921,0,0,0,7.9,7.9Z' transform='translate(-151.791 -114.106)' fill='%2355147f' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(191.777 14.905)'%3E%3Cpath d='M1418.952,172.9a6.652,6.652,0,1,0-6.652-6.652,6.66,6.66,0,0,0,6.652,6.652Z' transform='translate(-1412.3 -159.6)' fill='%23341270' fill-rule='evenodd'/%3E%3Cpath d='M1424.249,177.314a5.757,5.757,0,1,0-5.75-5.75,5.774,5.774,0,0,0,5.75,5.75Z' transform='translate(-1417.597 -164.898)' fill='%233d1273' fill-rule='evenodd'/%3E%3Cpath d='M1432.367,184.034a4.367,4.367,0,1,0-4.367-4.367,4.38,4.38,0,0,0,4.367,4.367Z' transform='translate(-1425.715 -173.015)' fill='%23491279' fill-rule='evenodd'/%3E%3Cpath d='M1440.484,190.768a2.984,2.984,0,1,0-2.984-2.984,2.988,2.988,0,0,0,2.984,2.984Z' transform='translate(-1433.832 -181.132)' fill='%2355147f' fill-rule='evenodd'/%3E%3C/g%3E%3C/g%3E%3Cg transform='translate(198.997 65.488)'%3E%3Cpath d='M1377.433,470.38a10.24,10.24,0,1,0-10.233-10.247,10.263,10.263,0,0,0,10.233,10.247Z' transform='translate(-1367.185 -449.9)' fill='%23f66' fill-rule='evenodd'/%3E%3Cpath d='M1391.076,449.9a10.24,10.24,0,1,1,0,20.48c-1.033-.277-3.2-.451-2.853-1.412.175-.48,1.543.189,2.9.306,1.805.131,3.7-.233,3.916-.815.306-.873-1.863-.291-4.367-.422-2.969-.16-6.376-1.033-6.288-2.416.073-1.048,3.057.306,6,.568,3,.277,5.953-.553,6.114-2.3.16-1.776-2.737-1.325-6.084-1.4-3.13-.073-7.1-1.135-7.234-3.028-.146-2.038,3.057-1.194,6.084-1.252,3.057-.058,5.953-1.034,5.415-3.071-.291-1.106-2.111-.408-4.367-.306s-4.993-.378-5.167-1.31c-.32-1.747,3.784-3.406,5.939-3.625Z' transform='translate(-1380.829 -449.9)' fill='%23c43f57' fill-rule='evenodd'/%3E%3Cpath d='M1377.348,449.9c.335,0,.67.015.99.044h-.233a10.25,10.25,0,0,0-.99,20.451,10.249,10.249,0,0,1,.233-20.5Z' transform='translate(-1367.1 -449.9)' fill='%23df99ff' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(72.271 34.338)'%3E%3Cpath d='M498.727,240.354a2.227,2.227,0,1,0-2.227-2.227,2.236,2.236,0,0,0,2.227,2.227Z' transform='translate(-496.5 -235.9)' fill='%237c1370' fill-rule='evenodd'/%3E%3Cpath d='M505.589,238.315a2.228,2.228,0,0,1-1.223,4.09,1.582,1.582,0,0,1-.262-.015,2.228,2.228,0,0,1,1.223-4.09c.087,0,.175.015.262.015Z' transform='translate(-502.139 -237.951)' fill='%23be2385' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(112.024 55.983)'%3E%3Cpath d='M784.942,415.284A15.342,15.342,0,1,0,769.6,399.942a15.372,15.372,0,0,0,15.342,15.342Z' transform='translate(-769.6 -384.6)' fill='%236838a4' fill-rule='evenodd'/%3E%3Cpath d='M804.167,431.234A12.067,12.067,0,1,0,792.1,419.167a12.092,12.092,0,0,0,12.067,12.067Z' transform='translate(-788.825 -403.825)' fill='%23794dae' fill-rule='evenodd'/%3E%3Cpath d='M819.718,444.136a9.418,9.418,0,1,0-9.418-9.418,9.433,9.433,0,0,0,9.418,9.418Z' transform='translate(-804.376 -419.376)' fill='%239e7ec5' fill-rule='evenodd'/%3E%3Cpath d='M827.151,450.3A8.151,8.151,0,1,0,819,442.151a8.166,8.166,0,0,0,8.151,8.151Z' transform='translate(-811.809 -426.809)' fill='%23fff' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(44.134 114.12)'%3E%3Cpath d='M303.984,888.147a.755.755,0,0,1,.393.1c.116.073,13.974-7.773,14.047-7.656s-13.625,8.21-13.625,8.37a.8.8,0,1,1-1.6,0,.79.79,0,0,1,.786-.815Z' transform='translate(-303.197 -866.531)' fill='%23ffc' fill-rule='evenodd'/%3E%3Cpath d='M304.926,934.952a.626.626,0,1,0,0-1.252.621.621,0,0,0-.626.626.631.631,0,0,0,.626.626Z' transform='translate(-304.139 -911.909)' fill='%23ff6' fill-rule='evenodd'/%3E%3Cpath d='M305.822,936.344a.422.422,0,1,0-.422-.422.422.422,0,0,0,.422.422Z' transform='translate(-305.079 -913.447)' fill='%23fc0' fill-rule='evenodd'/%3E%3Cpath d='M425.943,796.372c.029-.015,21.368-12.416,21.4-12.373s-21.208,12.591-21.252,12.62c-.291.175-.408-.087-.146-.247Z' transform='translate(-407.951 -783.999)' fill='%23ffc' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(7.773 4.09)'%3E%3Cpath d='M641.864,111.213a.36.36,0,0,0,.364-.364.348.348,0,0,0-.364-.349.357.357,0,1,0,0,.713Z' transform='translate(-555.896 -98.506)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M480.564,81.628a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-418.075 -73.214)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M416.364,279.228a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-363.22 -242.051)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M554.064,530.028a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-480.876 -456.345)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M421.264,652.213a.357.357,0,0,0,.364-.349.37.37,0,0,0-.364-.364.357.357,0,1,0,0,.713Z' transform='translate(-367.406 -560.757)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M473.164,662.028a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-411.752 -569.131)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M687.964,847.128a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-595.285 -727.287)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M621.364,891.713a.36.36,0,0,0,.364-.364.348.348,0,0,0-.364-.349.357.357,0,1,0,0,.713Z' transform='translate(-538.38 -765.395)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M179.264,689.128a.364.364,0,1,0-.364-.364.38.38,0,0,0,.364.364Z' transform='translate(-160.632 -592.286)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M799.164,642.228a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-690.299 -552.213)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1028.764,745.928a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-886.478 -640.818)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1243.664,543.428a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1070.097 -467.794)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1401.664,348.328a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-1205.098 -301.093)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1362.164,254.528a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1171.348 -220.947)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1473.944,203.613a.357.357,0,1,0,0-.713.348.348,0,0,0-.349.364.336.336,0,0,0,.349.349Z' transform='translate(-1266.869 -177.456)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1552.364,197.728a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1333.862 -172.415)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1453.364,157.728a.364.364,0,1,0-.364-.364.352.352,0,0,0,.364.364Z' transform='translate(-1249.273 -138.237)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1305.364,39.728a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-1122.816 -37.413)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1673.364,39.728a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-1437.249 -37.413)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1663.464,229.828a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1428.79 -199.842)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1539.964,471.828a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1323.267 -406.616)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1651.064,578.028a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-1418.195 -497.358)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1591.864,753.413a.36.36,0,0,0,.364-.364.348.348,0,0,0-.364-.349.357.357,0,1,0,0,.713Z' transform='translate(-1367.612 -647.226)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1273.264,738.528a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1095.388 -634.495)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1142.364,859.528a.364.364,0,1,0-.364-.364.38.38,0,0,0,.364.364Z' transform='translate(-983.542 -737.882)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1026.364,123.628a.348.348,0,0,0,.349-.364.357.357,0,1,0-.349.364Z' transform='translate(-884.427 -109.101)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M132.364,52.028a.348.348,0,0,0,.349-.364.357.357,0,1,0-.713,0,.37.37,0,0,0,.364.364Z' transform='translate(-120.559 -47.923)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M145.2,62.494a.59.59,0,0,0,.6-.6.6.6,0,0,0-.6-.6.609.609,0,0,0-.6.6.6.6,0,0,0,.6.6Z' transform='translate(-131.325 -56.467)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M279.6,29.294a.6.6,0,0,0,.6-.6.609.609,0,0,0-.6-.6.6.6,0,0,0-.6.6.59.59,0,0,0,.6.6Z' transform='translate(-246.161 -28.1)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M329,76.194a.609.609,0,0,0,.6-.6.6.6,0,0,0-.6-.6.6.6,0,0,0,0,1.194Z' transform='translate(-288.371 -68.173)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M641.3,52.794a.6.6,0,0,0,.6-.6.59.59,0,0,0-.6-.6.6.6,0,0,0,0,1.194Z' transform='translate(-555.212 -48.179)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M266.4,375.394a.6.6,0,0,0,.6-.6.609.609,0,0,0-.6-.6.6.6,0,0,0-.6.6.59.59,0,0,0,.6.6Z' transform='translate(-234.883 -323.821)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M572.6,718.694a.6.6,0,0,0,.6-.6.609.609,0,0,0-.6-.6.6.6,0,1,0,0,1.194Z' transform='translate(-496.512 -617.15)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M54,876.694a.6.6,0,1,0,0-1.194.609.609,0,0,0-.6.6.6.6,0,0,0,.6.6Z' transform='translate(-53.4 -752.152)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1002.3,908.794a.59.59,0,0,0,.6-.6.6.6,0,0,0-.6-.6.609.609,0,0,0-.6.6.59.59,0,0,0,.6.6Z' transform='translate(-863.664 -779.579)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1192.9,474.194a.6.6,0,0,0,.6-.6.59.59,0,0,0-.6-.6.6.6,0,1,0,0,1.194Z' transform='translate(-1026.52 -408.24)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1588.1,673.494a.59.59,0,0,0,.6-.6.6.6,0,0,0-.6-.6.609.609,0,0,0-.6.6.6.6,0,0,0,.6.6Z' transform='translate(-1364.195 -578.53)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M935.4,220.094a.6.6,0,0,0,.6-.6.59.59,0,0,0-.6-.6.6.6,0,0,0-.6.6.59.59,0,0,0,.6.6Z' transform='translate(-806.502 -191.127)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1582.6,63.494a.609.609,0,0,0,.6-.6.6.6,0,1,0-1.194,0,.609.609,0,0,0,.6.6Z' transform='translate(-1359.495 -57.322)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M679.247,446.995a.247.247,0,1,0-.247-.247.245.245,0,0,0,.247.247Z' transform='translate(-587.937 -385.597)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M677.547,160.995a.255.255,0,0,0,.247-.247.245.245,0,0,0-.247-.247.247.247,0,1,0,0,.495Z' transform='translate(-586.484 -141.228)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M965.247,65.595a.255.255,0,0,0,.247-.247.245.245,0,0,0-.247-.247.237.237,0,0,0-.247.247.245.245,0,0,0,.247.247Z' transform='translate(-832.306 -59.714)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1315.948,297.695a.247.247,0,1,0-.247-.247.237.237,0,0,0,.247.247Z' transform='translate(-1131.958 -258.029)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1565.348,297.695a.255.255,0,0,0,.247-.247.245.245,0,0,0-.247-.247.255.255,0,0,0-.248.247.237.237,0,0,0,.248.247Z' transform='translate(-1345.055 -258.029)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1627.048,517.495a.247.247,0,0,0,0-.495.247.247,0,1,0,0,.495Z' transform='translate(-1397.774 -445.835)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1041.748,537.295a.247.247,0,0,0,0-.495.247.247,0,1,0,0,.495Z' transform='translate(-897.671 -462.753)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1138.147,729.895a.247.247,0,1,0-.247-.247.245.245,0,0,0,.247.247Z' transform='translate(-980.039 -627.318)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M426.947,406.395a.247.247,0,1,0,0-.495.255.255,0,0,0-.247.247.245.245,0,0,0,.247.247Z' transform='translate(-372.362 -350.907)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M256.447,213.195a.247.247,0,1,0-.247-.247.245.245,0,0,0,.247.247Z' transform='translate(-226.68 -185.829)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M251.547,337.295a.247.247,0,1,0-.247-.247.255.255,0,0,0,.247.247Z' transform='translate(-222.493 -291.865)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M157.747,510.095a.247.247,0,0,0,0-.495.245.245,0,0,0-.247.247.237.237,0,0,0,.247.247Z' transform='translate(-142.347 -439.512)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M214.347,175.195a.245.245,0,0,0,.247-.247.247.247,0,0,0-.495,0,.245.245,0,0,0,.247.247Z' transform='translate(-190.708 -153.361)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M370.14,322.495a.255.255,0,0,0,.247-.247.245.245,0,0,0-.247-.247.255.255,0,0,0-.247.247.237.237,0,0,0,.247.247Z' transform='translate(-323.823 -279.22)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M192.647,872.695a.247.247,0,1,0-.247-.247.245.245,0,0,0,.247.247Z' transform='translate(-172.167 -749.332)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M542.948,937.295a.255.255,0,0,0,.247-.247.245.245,0,0,0-.247-.247.255.255,0,0,0-.247.247.245.245,0,0,0,.247.247Z' transform='translate(-471.477 -804.529)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1691.248,881.995a.247.247,0,1,0-.248-.247.255.255,0,0,0,.248.247Z' transform='translate(-1452.629 -757.278)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1331.448,644.195a.247.247,0,0,0,0-.495.247.247,0,0,0,0,.495Z' transform='translate(-1145.202 -554.093)' fill='%23fff' fill-rule='evenodd'/%3E%3C/g%3E%3C/svg%3E\");cursor:url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"40\" height=\"40\" viewBox=\"0 0 40 40\"><g transform=\"translate(-844 -500)\"><g transform=\"translate(844 -520.36)\"><path d=\"M194.787,1212.29a2.858,2.858,0,1,0,2.858,2.858,2.869,2.869,0,0,0-2.858-2.858Z\" transform=\"translate(-174.792 -174.793)\" fill=\"%23868686\"/><path d=\"M209.416,1228.35a1.429,1.429,0,1,1-1.424,1.424,1.419,1.419,0,0,1,1.424-1.424Z\" transform=\"translate(-189.421 -189.419)\" fill=\"%23ff655b\"/><g transform=\"translate(0 1020.36)\"><path d=\"M216.024,1020.36v12.855h1.424V1020.36Z\" transform=\"translate(-196.736 -1020.36)\" fill=\"%23868686\"/><path d=\"M216.024,1324.26v12.866h1.424V1324.26Z\" transform=\"translate(-196.736 -1297.126)\" fill=\"%23868686\"/><path d=\"M304.016,1236.27v1.434h12.855v-1.434Z\" transform=\"translate(-276.871 -1216.992)\" fill=\"%23868686\"/><path d=\"M0,1236.27v1.434H12.855v-1.434Z\" transform=\"translate(0 -1216.992)\" fill=\"%23868686\"/></g><g transform=\"translate(8.861 1029.216)\"><path d=\"M244.5,1119.548a.714.714,0,0,0-.12,1.409,10,10,0,0,1,7.4,7.391.715.715,0,0,0,1.391-.33v0a11.431,11.431,0,0,0-8.454-8.443.718.718,0,0,0-.212-.023Z\" transform=\"translate(-230.918 -1119.547)\" fill=\"%23868686\"/><path d=\"M107.971,1119.589a.721.721,0,0,0-.19.023,11.428,11.428,0,0,0-8.44,8.427.714.714,0,0,0,1.379.369c0-.01.005-.021.008-.031a10,10,0,0,1,7.386-7.377.714.714,0,0,0-.142-1.409Z\" transform=\"translate(-99.31 -1119.586)\" fill=\"%23868686\"/><path d=\"M252.407,1264.338a.714.714,0,0,0-.712.555,10,10,0,0,1-7.386,7.38.714.714,0,0,0,.282,1.4l.053-.013a11.43,11.43,0,0,0,8.44-8.429.713.713,0,0,0-.678-.893Z\" transform=\"translate(-230.835 -1251.41)\" fill=\"%23868686\"/><path d=\"M99.924,1264.077a.714.714,0,0,0-.656.89,11.431,11.431,0,0,0,8.44,8.454.715.715,0,0,0,.335-1.39h0a9.995,9.995,0,0,1-7.386-7.4.714.714,0,0,0-.734-.558h0Z\" transform=\"translate(-99.246 -1251.172)\" fill=\"%23868686\"/></g><g transform=\"translate(2 1022.36)\" fill=\"none\" stroke=\"%23707070\" stroke-width=\"2\"><circle cx=\"18\" cy=\"18\" r=\"18\" stroke=\"none\"/><circle cx=\"18\" cy=\"18\" r=\"17\" fill=\"none\"/></g></g></g></svg>') 16 16, auto}.asteroid{width:40px;height:40px;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg transform='translate(0 0)'%3E%3Cpath d='M230.994,11.742,221.867,22.4v2A14.671,14.671,0,0,0,236.3,12.366,25.741,25.741,0,0,0,230.994,11.742Z' transform='translate(-195.867 -10.366)' fill='%234a8dc6'/%3E%3Cpath d='M146.179,11.984l.035-.268a31.976,31.976,0,0,0-20.381,7.4,14.635,14.635,0,0,0,11.254,5.262v-2C141.56,22.375,145.383,18,146.179,11.984Z' transform='translate(-111.088 -10.34)' fill='%2377aad4'/%3E%3Cpath d='M241.059,24.221A10.663,10.663,0,0,0,233.9,7.441a22.167,22.167,0,0,0-8.472-4.913c.011-.057.022-.114.033-.171a2,2,0,0,0-3.936-.713,12.621,12.621,0,0,1-1.353,3.82l-12.81,51.886a10.663,10.663,0,0,0,17.178-4.719,35.188,35.188,0,0,0,4.576-3.339,4.666,4.666,0,0,0,5.2-5.506A31.8,31.8,0,0,0,241.059,24.221Z' transform='translate(-183.064 0)' fill='%23a5c6e3'/%3E%3Cpath d='M53.914,67.8c.528-6.259-1.372-11.9-5.351-15.875A18.917,18.917,0,0,0,37.11,46.619a12.672,12.672,0,0,1-20.83,2.026,2,2,0,1,0-3.068,2.567l.016.019q-.657.6-1.293,1.229a35.744,35.744,0,0,0-4.177,5.017A12.672,12.672,0,0,0,2.013,76.009,23.1,23.1,0,0,0,8.608,91.916,23.064,23.064,0,0,0,24.3,98.505a51.738,51.738,0,0,0,20.936-12.78A29.072,29.072,0,0,0,53.914,67.8Z' transform='translate(0 -41.156)' fill='%23d2e3f1'/%3E%3Cpath d='M267.378,364.089v13.333a6.667,6.667,0,0,0,0-13.333Z' transform='translate(-236.045 -321.423)' fill='%234a8dc6'/%3E%3Cpath d='M219.821,370.756c0-3.682-1.194-6.667-2.667-6.667a6.667,6.667,0,0,0,0,13.333C218.628,377.422,219.821,374.438,219.821,370.756Z' transform='translate(-185.821 -321.423)' fill='%2377aad4'/%3E%3Cpath d='M420.978,96.711v13.333a6.667,6.667,0,0,0,0-13.333Z' transform='translate(-371.645 -85.378)' fill='%234a8dc6'/%3E%3Cpath d='M373.421,103.378c0-3.682-1.194-6.667-2.667-6.667a6.667,6.667,0,1,0,0,13.333C372.228,110.044,373.421,107.06,373.421,103.378Z' transform='translate(-321.421 -85.378)' fill='%2377aad4'/%3E%3Cg transform='translate(15.667 25)'%3E%3Ccircle cx='1' cy='1' r='1' transform='translate(13.333 4)' fill='%23a5c6e3'/%3E%3Ccircle cx='1' cy='1' r='1' transform='translate(17.333)' fill='%23a5c6e3'/%3E%3Ccircle cx='1' cy='1' r='1' transform='translate(28 12.667)' fill='%23a5c6e3'/%3E%3Ccircle cx='1' cy='1' r='1' transform='translate(0 24.667)' fill='%23a5c6e3'/%3E%3C/g%3E%3Cpath d='M108.089,164.978v17.333a8.667,8.667,0,1,0,0-17.333Z' transform='translate(-95.422 -145.645)' fill='%234a8dc6'/%3E%3Cpath d='M47.466,173.644c0-4.786-2.089-8.667-4.667-8.667a8.667,8.667,0,1,0,0,17.333C45.377,182.31,47.466,178.43,47.466,173.644Z' transform='translate(-30.133 -145.644)' fill='%2377aad4'/%3E%3C/g%3E%3C/svg%3E\");background-size:contain;background-repeat:no-repeat}.spaceship{width:36px;height:46px;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='26.342' height='36' viewBox='0 0 26.342 36'%3E%3Cg transform='translate(-123.583 0)'%3E%3Cpath d='M136.755,150.063l-12.512,10.01a1.756,1.756,0,0,0-.659,1.371v4.424l13.171-2.634,13.171,2.634v-4.424a1.756,1.756,0,0,0-.659-1.371Z' transform='translate(-0.001 -135.137)' fill='%23ff6464'/%3E%3Cpath d='M220.616,313.138l-1.044-4.177h-6.64l-1.044,4.177a.878.878,0,0,0,.852,1.091h7.025a.878.878,0,0,0,.852-1.091Z' transform='translate(-79.498 -278.23)' fill='%23959cb3'/%3E%3Cpath d='M214.523,313.138l1.044-4.177h-2.634l-1.044,4.177a.878.878,0,0,0,.852,1.091h2.634a.878.878,0,0,1-.852-1.091Z' transform='translate(-79.498 -278.23)' fill='%23707487'/%3E%3Cpath d='M207.569.429,203.48,7.736a3.513,3.513,0,0,0-.447,1.715V30.732a1.756,1.756,0,0,0,1.756,1.756h7.025a1.756,1.756,0,0,0,1.756-1.756V9.45a3.511,3.511,0,0,0-.447-1.715L209.034.429A.839.839,0,0,0,207.569.429Z' transform='translate(-71.547 0)' fill='%23e4eaf6'/%3E%3Cpath d='M206.545,30.781V9.5a7.658,7.658,0,0,1,.186-1.715l1.7-7.307a1.111,1.111,0,0,1,.157-.371.833.833,0,0,0-1.023.371L203.48,7.785a3.513,3.513,0,0,0-.447,1.715V30.781a1.756,1.756,0,0,0,1.756,1.756h2.488C206.873,32.537,206.545,31.751,206.545,30.781Z' transform='translate(-71.547 -0.049)' fill='%23c7cfe2'/%3E%3Cpath d='M209.035.43a.839.839,0,0,0-1.464,0l-4.089,7.307a3.513,3.513,0,0,0-.447,1.715v4.6h10.537v-4.6a3.511,3.511,0,0,0-.447-1.715Z' transform='translate(-71.548 -0.001)' fill='%23ff6464'/%3E%3Cpath d='M206.546,9.512a7.658,7.658,0,0,1,.186-1.715l1.7-7.307a1.111,1.111,0,0,1,.157-.371.86.86,0,0,0-.553-.012c-.013,0-.026.011-.039.016a.812.812,0,0,0-.193.106c-.019.014-.038.027-.056.043a.821.821,0,0,0-.182.218L203.481,7.8a3.513,3.513,0,0,0-.447,1.715v4.6h3.512Z' transform='translate(-71.548 -0.061)' fill='%23d2555a'/%3E%3Cpath d='M213.571,141.235H203.034v1.756h2.252a3.469,3.469,0,0,0,6.034,0h2.252v-1.756Z' transform='translate(-71.548 -127.187)' fill='%23c7cfe2'/%3E%3Ccircle cx='1.756' cy='1.756' r='1.756' transform='translate(134.999 12.292)' fill='%235b5d6e'/%3E%3Cpath d='M206.546,144.266v-3.032h-3.512v1.756h2.252A3.551,3.551,0,0,0,206.546,144.266Z' transform='translate(-71.548 -127.186)' fill='%23afb9d2'/%3E%3Cpath d='M219.677.429l-3.2,5.716h7.863l-3.2-5.716A.839.839,0,0,0,219.677.429Z' transform='translate(-83.655 0)' fill='%23707487'/%3E%3Cpath d='M219.211,6.206,220.544.489A1.111,1.111,0,0,1,220.7.118a.86.86,0,0,0-.553-.012l-.011,0-.028.011a.812.812,0,0,0-.193.106l-.02.015c-.012.009-.025.018-.037.028a.823.823,0,0,0-.182.218l-3.2,5.716h2.732Z' transform='translate(-83.656 -0.06)' fill='%235b5d6e'/%3E%3Cg transform='translate(123.583 25.463)'%3E%3Cpath d='M123.584,261.264l7.9-1.581V256l-7.9,2.107Z' transform='translate(-123.584 -255.996)' fill='%23d2555a'/%3E%3Cpath d='M316.87,261.264l-7.9-1.581V256l7.9,2.107Z' transform='translate(-290.527 -255.996)' fill='%23d2555a'/%3E%3C/g%3E%3Cg transform='translate(123.583 25.463)'%3E%3Cpath d='M124.462,264.824h0a.878.878,0,0,0-.878.878v7.025a.878.878,0,0,0,.878.878h0a.878.878,0,0,0,.878-.878V265.7A.878.878,0,0,0,124.462,264.824Z' transform='translate(-123.584 -263.946)' fill='%23afb9d2'/%3E%3Cpath d='M159.773,256h0a.878.878,0,0,0-.878.878v4.39a.878.878,0,0,0,.878.878h0a.878.878,0,0,0,.878-.878v-4.39A.878.878,0,0,0,159.773,256Z' transform='translate(-155.383 -255.996)' fill='%23afb9d2'/%3E%3Cpath d='M371.639,264.824h0a.878.878,0,0,1,.878.878v7.025a.878.878,0,0,1-.878.878h0a.878.878,0,0,1-.878-.878V265.7A.878.878,0,0,1,371.639,264.824Z' transform='translate(-346.175 -263.946)' fill='%23afb9d2'/%3E%3Cpath d='M336.328,256h0a.878.878,0,0,1,.878.878v4.39a.878.878,0,0,1-.878.878h0a.878.878,0,0,1-.878-.878v-4.39A.878.878,0,0,1,336.328,256Z' transform='translate(-314.376 -255.996)' fill='%23afb9d2'/%3E%3C/g%3E%3Cg transform='translate(123.583 25.446)'%3E%3Ccircle cx='0.895' cy='0.895' r='0.895' transform='translate(0 0.862)' fill='%23959cb3'/%3E%3Ccircle cx='0.895' cy='0.895' r='0.895' transform='translate(3.496)' fill='%23959cb3'/%3E%3Ccircle cx='0.895' cy='0.895' r='0.895' transform='translate(24.552 0.862)' fill='%23959cb3'/%3E%3Ccircle cx='0.895' cy='0.895' r='0.895' transform='translate(21.057)' fill='%23959cb3'/%3E%3C/g%3E%3Cg transform='translate(135.876 23.707)'%3E%3Cpath d='M248.05,243.608h0a.878.878,0,0,0,.878-.878v-3.512a.878.878,0,0,0-.878-.878h0a.878.878,0,0,0-.878.878v3.512A.878.878,0,0,0,248.05,243.608Z' transform='translate(-247.172 -238.34)' fill='%23c7cfe2'/%3E%3Cpath d='M274.534,243.608h0a.878.878,0,0,0,.878-.878v-3.512a.878.878,0,0,0-.878-.878h0a.878.878,0,0,0-.878.878v3.512A.878.878,0,0,0,274.534,243.608Z' transform='translate(-271.022 -238.34)' fill='%23c7cfe2'/%3E%3C/g%3E%3Cpath d='M221.567,243.608h0a.878.878,0,0,0,.878-.878v-3.512a.878.878,0,0,0-.878-.878h0a.878.878,0,0,0-.878.878v3.512A.878.878,0,0,0,221.567,243.608Z' transform='translate(-87.447 -214.633)' fill='%23afb9d2'/%3E%3C/g%3E%3C/svg%3E\");background-size:contain;background-repeat:no-repeat}.asteroid.active{width:60px;height:60px;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='65' height='64' viewBox='0 0 65 64'%3E%3Cg transform='translate(-1003 -490)'%3E%3Ccircle cx='23.5' cy='23.5' r='23.5' transform='translate(1009 502)' fill='%23d2e3f1'/%3E%3Ccircle cx='9' cy='9' r='9' transform='translate(1009 502)' fill='%23d2e3f1'/%3E%3Ccircle cx='12' cy='12' r='12' transform='translate(1021 490)' fill='%23d2e3f1'/%3E%3Ccircle cx='12' cy='12' r='12' transform='translate(1033 499)' fill='%23d2e3f1'/%3E%3Ccircle cx='12' cy='12' r='12' transform='translate(1003 520)' fill='%23d2e3f1'/%3E%3Ccircle cx='12' cy='12' r='12' transform='translate(1033 530)' fill='%23d2e3f1'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1048 523)' fill='%23d2e3f1'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1010 523)' fill='%234a8dc6'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1015 514)' fill='%234a8dc6'/%3E%3Ccircle cx='18' cy='18' r='18' transform='translate(1018 504)' fill='%234a8dc6'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1010 523)' fill='%234a8dc6'/%3E%3Ccircle cx='4.5' cy='4.5' r='4.5' transform='translate(1059 513)' fill='%23d2e3f1'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1036 533)' fill='%234a8dc6'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1027 499)' fill='%234a8dc6'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1020 518)' fill='%2377aad4'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1033 507)' fill='%2377aad4'/%3E%3Ccircle cx='5.5' cy='5.5' r='5.5' transform='translate(1037 527)' fill='%2377aad4'/%3E%3Ccircle cx='4' cy='4' r='4' transform='translate(1037 527)' fill='%23fff'/%3E%3Ccircle cx='4' cy='4' r='4' transform='translate(1026 520)' fill='%23fff'/%3E%3Ccircle cx='4' cy='4' r='4' transform='translate(1040 511)' fill='%23fff'/%3E%3C/g%3E%3C/svg%3E\");background-size:contain;background-repeat:no-repeat}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSlNFQ2FwdGNoYS5zdmVsdGUiLCJzb3VyY2VzIjpbIkpTRUNhcHRjaGEuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjwhLS0gRE9NIFRhZyBOYW1lLS0+XG48c3ZlbHRlOm9wdGlvbnMgdGFnPVwianNlLWNhcHRjaGFcIi8+XG48IS0tIHhET00gVGFnIE5hbWUtLT5cblxuPCEtLSBKU0UgQ2FwdGNoYSAtLT5cbjwhLS0gXG5cdE9wdGlvbmFsIGNsYXNzZXNcblx0ZmxhdDogc3dhcHMgdG8gZmxhdCBkZXNpZ25cblx0UzogU21hbGwgY2FwdGNoYVxuXHRNOiBNZWNpdW0gY2FwdGNoYVxuXHRzdWNjZXNzOiBkaXNwbGF5cyBzdWNjZXNzIHBhbmVsIGNhcHRjaGEgbXVzdCBiZSBtaW5pbWlzZWRcbi0tPlxuXG48c2VjdGlvbiBpZD1cIkpTRS1DYXB0Y2hhXCIgY2xhc3M9XCJ7dGhlbWV9IHtzaXplfVwiIGNsYXNzOmFjdGl2ZT1cIntzaG93Q2FwdGNoYX1cIiBjbGFzczpzdWNjZXNzPVwie2NvbXBsZXRlfVwiIGNsYXNzOnRoaW5raW5nPVwie3RoaW5raW5nfVwiPlxuXHQ8ZGV0YWlscyBjbGFzcz1cImNhcHRjaGFQYW5lbFwiIGJpbmQ6b3BlbiBvcGVuPlxuXHRcdDwhLS0gQ2FwdGNoYSBQYW5lbCAtLT5cblx0XHQ8c3VtbWFyeT5cblx0XHRcdDwhLS0gSW5wdXQgc2VsZWN0IGZpZWxkIC0tPlxuXHRcdFx0PGRpdiBpZD1cIkpTRS1pbnB1dFwiPlxuXHRcdFx0XHQ8aW5wdXQgaWQ9XCJjYXB0Y2hhQ2hlY2tcIiB0eXBlPVwiY2hlY2tib3hcIiBiaW5kOmNoZWNrZWQ9e2NhcHRjaGFDaGVja30gLz5cblx0XHRcdDwvZGl2PlxuXHRcdFx0PCEtLSB4SW5wdXQgc2VsZWN0IGZpZWxkIC0tPlxuXHRcdFx0XG5cdFx0XHQ8IS0tIEluZm8gbXNnIC0tPlxuXHRcdFx0PGRpdiBpZD1cIkpTRS1tc2dcIj5cblx0XHRcdFx0PHA+PC9wPlxuXHRcdFx0PC9kaXY+XG5cdFx0XHQ8IS0tIHhJbmZvIG1zZyAtLT5cblxuXHRcdFx0PCEtLSBKU0UgbG9nbyAtLT5cblx0XHRcdDxkaXYgaWQ9XCJKU0UtYnJhbmRcIj48c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDcxLjc3MSA2OS45MzFcIj48ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoMClcIj48cGF0aCBkPVwiTTU1Ljg0LDQwNi45MjksNTUuOCw0MTguOWE3LjE0NCw3LjE0NCwwLDAsMCwzLjUzNiw2LjEyOGwxMC40NzEsNmE3LjE1LDcuMTUsMCwwLDAsNy4wMDcuMDE2bDEwLjU0My02LjA4N2E3LjAzOSw3LjAzOSwwLDAsMCwzLjUyOC02LjFsLjA0LTExLjk3MmE3LjE0Myw3LjE0MywwLDAsMC0zLjUzNi02LjEyN2wtMTAuNDcxLTZhNy4xNSw3LjE1LDAsMCwwLTcuMDA3LS4wMTZsLTEwLjU0Myw2LjA3OUE3LjA0Myw3LjA0MywwLDAsMCw1NS44NCw0MDYuOTI5Wm0xNy41MTktNi45NDMsMTEuMTg5LDYuNTIzLS4wMDgsMTIuODQ0TDczLjQwNyw0MjUuNzhsLTExLjEzMy02LjQxOC0uMDU3LTEyLjk0OVpcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTU1LjggLTM2Mi4wNDUpXCIgZmlsbD1cIiM1MWJmZWNcIi8+PHBhdGggZD1cIk01MDkuNzQsNDA3LjIyOSw1MDkuNyw0MTkuMmE3LjE0NCw3LjE0NCwwLDAsMCwzLjUzNiw2LjEyOGwxMC40NzEsNmE3LjE1LDcuMTUsMCwwLDAsNy4wMDguMDE2bDEwLjU0My02LjA4N2E3LjAzOSw3LjAzOSwwLDAsMCwzLjUyOC02LjFsLjA0LTExLjk3MmE3LjE0NCw3LjE0NCwwLDAsMC0zLjUzNi02LjEyOGwtMTAuNDcxLTZhNy4xNSw3LjE1LDAsMCwwLTcuMDA3LS4wMTZsLTEwLjU0NCw2LjA4N0E3LjA2Myw3LjA2MywwLDAsMCw1MDkuNzQsNDA3LjIyOVptMTcuNTE5LTYuOTM1LDExLjE4OSw2LjUyMy0uMDA4LDEyLjg0NC0xMS4xMzMsNi40MjYtMTEuMTI1LTYuNDE4LS4wNTctMTIuOTQ5WlwiIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgtNDczLjA1NiAtMzYyLjMyMSlcIiBmaWxsPVwiIzUxYmZlY1wiLz48cGF0aCBkPVwiTTI4Mi41NCwxMy4xMjksMjgyLjUsMjUuMWE3LjE0NCw3LjE0NCwwLDAsMCwzLjUzNiw2LjEyN2wxMC40NzEsNmE3LjE1LDcuMTUsMCwwLDAsNy4wMDcuMDE2bDEwLjU0My02LjA4N2E3LjAzOSw3LjAzOSwwLDAsMCwzLjUyOC02LjFsLjA0LTExLjk3MmE3LjE0NCw3LjE0NCwwLDAsMC0zLjUzNi02LjEyN2wtMTAuNDcxLTZhNy4xNSw3LjE1LDAsMCwwLTcuMDA3LS4wMTZMMjg2LjA2OCw3LjAzNEE3LjAzLDcuMDMsMCwwLDAsMjgyLjU0LDEzLjEyOVptMTcuNTExLTYuOTM1LDExLjE4OSw2LjUxNS0uMDA4LDEyLjg0NEwzMDAuMSwzMS45OGwtMTEuMTI1LTYuNDE4LS4wNTYtMTIuOTQxWlwiIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgtMjY0LjE5OCAtMC4wMzcpXCIgZmlsbD1cIiM1MWJmZWNcIi8+PGcgdHJhbnNmb3JtPVwidHJhbnNsYXRlKDI3LjQ0IDY1Ljk3MylcIj48cGF0aCBkPVwiTTQxMSw4MTcuMjczYTI2Ljg1MSwyNi44NTEsMCwwLDEtMTMuNzgxLS4wMDgsMS4yMTQsMS4yMTQsMCwwLDAtLjY0NiwyLjM0MSwyOS41LDI5LjUsMCwwLDAsMTUuMDY0LjAwOCwxLjIzOSwxLjIzOSwwLDAsMCwuODQ4LTEuNDk0LDEuMjI2LDEuMjI2LDAsMCwwLTEuNDg1LS44NDhaXCIgdHJhbnNmb3JtPVwidHJhbnNsYXRlKC0zOTUuNjg4IC04MTcuMjI3KVwiIGZpbGw9XCIjNTFiZmVjXCIvPjwvZz48ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoNy43NDQgMTkuMzgpXCI+PGcgdHJhbnNmb3JtPVwidHJhbnNsYXRlKDApXCI+PHBhdGggZD1cIk0xNTQuMSwyNTQuMWEyNi44LDI2LjgsMCwwLDEsNi45LTExLjk0OCwxLjIxLDEuMjEsMCwxLDAtMS43MTItMS43MTIsMjkuMjU3LDI5LjI1NywwLDAsMC03LjUyNCwxMy4wMTQsMS4yMSwxLjIxLDAsMSwwLDIuMzMzLjY0NlpcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTE1MS43MjcgLTI0MC4wODcpXCIgZmlsbD1cIiM1MWJmZWNcIi8+PC9nPjwvZz48ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoNTQuMzUyIDE5LjM2NilcIj48ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoMClcIj48cGF0aCBkPVwiTTcyOS40LDI0MS45OWEyNi43MiwyNi43MiwwLDAsMSw2LjksMTEuOTQ4LDEuMjE0LDEuMjE0LDAsMSwwLDIuMzQxLS42NDYsMjkuMywyOS4zLDAsMCwwLTcuNTMyLTEzLjAyMiwxLjIxMywxLjIxMywwLDAsMC0xLjcxMSwxLjcyWlwiIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgtNzI5LjA1IC0yMzkuOTI1KVwiIGZpbGw9XCIjNTFiZmVjXCIvPjwvZz48L2c+PC9nPjwvc3ZnPjwvZGl2PlxuXHRcdFx0PCEtLSB4SlNFIGxvZ28gLS0+XG5cdFx0PC9zdW1tYXJ5PlxuXHRcdDwhLS0geENhcHRjaGEgUGFuZWwgLS0+XG5cblx0XHQ8IS0tIENhcHRjaGEgR2FtZSAtLT5cblx0XHQ8ZGl2IGlkPVwiSlNFLUNhcHRjaGFEaXNwbGF5XCI+XG5cdFx0XHQ8ZGl2IGlkPVwiSlNFLWNhcHRjaGEtZ2FtZS1jb250YWluZXJcIiBvbjptb3VzZW1vdmU9XCJ7aGFuZGxlTW92ZW1lbnR9XCIgb246dG91Y2htb3ZlPVwie2hhbmRsZU1vdmVtZW50fVwiPlxuXHRcdFx0eyNpZiBvcGVufVx0XG5cdFx0XHRcdDxkaXYgaWQ9XCJKU0UtY2FwdGNoYS1nYW1lXCI+XG5cdFx0XHRcdFx0PEFzdGVyb2lkcyBvbjpjb21wbGV0ZT1cIntjYWxsYmFja0Z1bmN0aW9ufVwiIC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0ey9pZn1cblx0XHRcdDwvZGl2PlxuXHRcdDwvZGl2PlxuXHRcdDwhLS0geENhcHRjaGEgR2FtZSAtLT5cblx0PC9kZXRhaWxzPlxuPC9zZWN0aW9uPlxuPCEtLSB4SlNFIENhcHRjaGEgLS0+XG5cblxuXG5cbjxzY3JpcHQ+XG5cdC8vbGlic1xuXHRpbXBvcnQgeyBvbk1vdW50LCBjcmVhdGVFdmVudERpc3BhdGNoZXIgfSBmcm9tICdzdmVsdGUnO1xuXHRpbXBvcnQgQXN0ZXJvaWRzIGZyb20gJy4vQXN0ZXJvaWRzLnN2ZWx0ZSdcblxuXHQvL1Byb3BzXG5cdGV4cG9ydCBsZXQgc2l6ZSA9ICdMJztcblx0ZXhwb3J0IGxldCB0aGVtZSA9ICdmbGF0Jztcblx0ZXhwb3J0IGxldCBjYXB0Y2hhU2VydmVyID0gJ2h0dHBzOi8vbG9hZC5qc2Vjb2luLmNvbSc7XG5cblx0Ly9FdmVudHNcblx0Y29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKTtcblx0XG5cdC8vSW5pdCBjYXB0Y2hhXG5cdGxldCBvcGVuID0gZmFsc2U7XG5cdGxldCBzaG93Q2FwdGNoYSA9IGZhbHNlO1xuXHRsZXQgY2FwdGNoYUNoZWNrID0gZmFsc2U7XG5cdGxldCB0aGlua2luZyA9IGZhbHNlO1xuXHRsZXQgY29tcGxldGUgPSBmYWxzZTtcblxuXHRzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRzaG93Q2FwdGNoYSA9IHRydWU7XG5cdH0sIDEwKTtcblxuXHQkOiBpZiAob3Blbikge1xuXHRcdGNvbXBsZXRlID0gZmFsc2U7XG5cdH1cblxuXHQvL01vdW50ZWRcblx0b25Nb3VudCgoKSA9PiB7XG5cdH0pO1xuXG5cdC8vU3VjY2Vzc1xuXHRkaXNwYXRjaCgnc3VjY2VzcycsICdzdWNjZXNzIGV2ZW50IHNlbnQnKTtcblxuXHQvL01ldGhvZHNcblx0LyoqXG4gICAgICogcmVxdWVzdFVSTFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXF1ZXN0XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHJlcXVlc3QubWV0aG9kIFRoZSBIVFRQIG1ldGhvZCB0byB1c2UgZm9yIHRoZSByZXF1ZXN0LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXF1ZXN0LnVybCBUaGUgVVJMIGZvciB0aGUgcmVxdWVzdFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXF1ZXN0LmNvbnRlbnQgVGhlIGJvZHkgY29udGVudCBmb3IgdGhlIHJlcXVlc3QuIE1heSBiZSBhIHN0cmluZyBvciBhbiBBcnJheUJ1ZmZlciAoZm9yIGJpbmFyeSBkYXRhKS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVxdWVzdC5oZWFkZXJzIEFuIG9iamVjdCBkZXNjcmliaW5nIGhlYWRlcnMgdG8gYXBwbHkgdG8gdGhlIHJlcXVlc3QgeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXF1ZXN0LnJlc3BvbnNlVHlwZSBUaGUgWE1MSHR0cFJlcXVlc3RSZXNwb25zZVR5cGUgdG8gYXBwbHkgdG8gdGhlIHJlcXVlc3QuXG4gICAgICogQHBhcmFtIHtib29sZWFufSByZXF1ZXN0LmFib3J0U2lnbmFsIEFuIEFib3J0U2lnbmFsIHRoYXQgY2FuIGJlIG1vbml0b3JlZCBmb3IgY2FuY2VsbGF0aW9uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXF1ZXN0LnRpbWVvdXQgVGhlIHRpbWUgdG8gd2FpdCBmb3IgdGhlIHJlcXVlc3QgdG8gY29tcGxldGUgYmVmb3JlIHRocm93aW5nIGEgVGltZW91dEVycm9yLiBNZWFzdXJlZCBpbiBtaWxsaXNlY29uZHMuXG4gICAgICovXG4gICAgY29uc3QgcmVxdWVzdFVSTCA9IChyZXF1ZXN0KSA9PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSAoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgICAgICAgIHhoci5vcGVuKHJlcXVlc3QubWV0aG9kLCByZXF1ZXN0LnVybCwgdHJ1ZSk7XG4gICAgICAgICAgICAvL3hoci53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ1gtUmVxdWVzdGVkLVdpdGgnLCAnWE1MSHR0cFJlcXVlc3QnKTtcblxuICAgICAgICAgICAgLy9zZXQgaGVhZGVyc1xuICAgICAgICAgICAgaWYgKHJlcXVlc3QuaGVhZGVycykge1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKHJlcXVlc3QuaGVhZGVycylcbiAgICAgICAgICAgICAgICAgICAgLmZvckVhY2goKGhlYWRlcikgPT4geGhyLnNldFJlcXVlc3RIZWFkZXIoaGVhZGVyLCByZXF1ZXN0LmhlYWRlcnNbaGVhZGVyXSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL3NldCByZXNwb25zZSB0eXBlXG4gICAgICAgICAgICBpZiAocmVxdWVzdC5yZXNwb25zZVR5cGUpIHtcbiAgICAgICAgICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gcmVxdWVzdC5yZXNwb25zZVR5cGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vYWJvcnQgcmVxXG4gICAgICAgICAgICBpZiAocmVxdWVzdC5hYm9ydFNpZ25hbCkge1xuICAgICAgICAgICAgICAgIHJlcXVlc3QuYWJvcnRTaWduYWwub25hYm9ydCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgeGhyLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy90aW1lb3V0IHRpbWVcbiAgICAgICAgICAgIGlmIChyZXF1ZXN0LnRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICB4aHIudGltZW91dCA9IHJlcXVlc3QudGltZW91dDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9vbiBzdGF0ZSBjaGFuZ2VcbiAgICAgICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXF1ZXN0LmFib3J0U2lnbmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmFib3J0U2lnbmFsLm9uYWJvcnQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gU29tZSBicm93c2VycyByZXBvcnQgeGhyLnN0YXR1cyA9PSAwIHdoZW4gdGhlXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlc3BvbnNlIGhhcyBiZWVuIGN1dCBvZmYgb3IgdGhlcmUncyBiZWVuIGEgVENQIEZJTi5cbiAgICAgICAgICAgICAgICAgICAgLy8gVHJlYXQgaXQgbGlrZSBhIDIwMCB3aXRoIG5vIHJlc3BvbnNlLlxuICAgICAgICAgICAgICAgICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogMjAwLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXNUZXh0OiB4aHIuc3RhdHVzVGV4dCB8fCBudWxsLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiB4aHIucmVzcG9uc2UgfHwgeGhyLnJlc3BvbnNlVGV4dCB8fCBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoeGhyLnN0YXR1cyA+PSAyMDAgJiYgeGhyLnN0YXR1cyA8IDMwMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogeGhyLnN0YXR1cywgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzVGV4dDogeGhyLnN0YXR1c1RleHQsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHhoci5yZXNwb25zZSB8fCB4aHIucmVzcG9uc2VUZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3Qoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZTogeGhyLnN0YXR1c1RleHQsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IHhoci5zdGF0dXMsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vY2F0Y2ggZXJyb3JzXG4gICAgICAgICAgICB4aHIub25lcnJvciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3Qoe1xuICAgICAgICAgICAgICAgICAgICBlcnJvck1lc3NhZ2U6IHhoci5zdGF0dXNUZXh0LCBcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogeGhyLnN0YXR1c1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy90aW1lb3V0XG4gICAgICAgICAgICB4aHIub250aW1lb3V0ID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdCh7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZTogJ0EgdGltZW91dCBvY2N1cnJlZCcsIFxuICAgICAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiAndGltZW91dCcsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvL2luaXQgcmVxXG4gICAgICAgICAgICB4aHIuc2VuZChyZXF1ZXN0LmNvbnRlbnQgfHwgJycpO1xuICAgICAgICB9KTtcblx0fTtcblxuXHQvKipcblx0ICogbG9hZEdhbWVcblx0ICogZGlzYWJsZWQgdW50aWwgZmlndXJlIGJlc3Qgd2F5IHRvIGRvIGNvZGUgc3BsaXR0aW5nLi4uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGdhbWVGaWxlIHVybCBvZiBnYW1lZmlsZSB0byBsb2FkXG4gICAgICogQHBhcmFtIHtjYWxsYmFja30gY2IgQ2FsbGJhY2sgZnVuY3Rpb25cblx0ICovXG5cdGNvbnN0IGxvYWRHYW1lID0gKGdhbWVGaWxlLGNiKSA9PiB7XG5cdFx0Lypcblx0XHQgLy9yZXF1ZXN0IGNvbmZcbiAgICAgICAgcmVxdWVzdFVSTCh7XG4gICAgICAgICAgICBtZXRob2Q6ICdnZXQnLFxuICAgICAgICAgICAgdXJsOiBgJHtjYXB0Y2hhU2VydmVyfS9jYXB0Y2hhL2xvYWQvJHtnYW1lRmlsZX1gXG4gICAgICAgIC8vc3VjY2Vzc1xuICAgICAgICB9KS50aGVuKChyZXMpID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKCdbcmVzXVtsb2FkQ29uZl0nLHJlcyk7XG5cdFx0XHRjYihyZXMuY29udGVudCk7XG4gICAgICAgICAgICBcbiAgICAgICAgLy9lcnJvclxuICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG5cdFx0fSk7XG5cdFx0Ki9cblx0fVxuXG5cdC8qKlxuXHQgKiBnYW1lQ29tcGxldGVkXG5cdCAqIGRpc2FibGVkIHVudGlsIGZpZ3VyZSBiZXN0IHdheSB0byBkbyBjb2RlIHNwbGl0dGluZy4uLlxuXHQgKi9cblx0Y29uc3QgZ2FtZUNvbXBsZXRlZCA9ICgpID0+IHtcblx0XHQvKlxuXHRcdG1sRGF0YS5maW5pc2hUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cdFx0bWxEYXRhLmdhbWVzQ29tcGxldGVkICs9IDE7XG5cdFx0c3VibWl0TUxEYXRhKFxuXHRcdChyZXMpID0+IHtcblx0XHRcdHZhciBKU0VDYXB0Y2hhUGFzcyA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuXHRcdFx0SlNFQ2FwdGNoYVBhc3MuaW5pdEV2ZW50KCdKU0VDYXB0Y2hhUGFzcycsIHRydWUsIHRydWUpO1xuXHRcdFx0SlNFQ2FwdGNoYVBhc3MuaXAgPSByZXMuaXA7XG5cdFx0XHRKU0VDYXB0Y2hhUGFzcy5yYXRpbmcgPSByZXMucmF0aW5nO1xuXHRcdFx0SlNFQ2FwdGNoYVBhc3MucGFzcyA9IHJlcy5wYXNzO1xuXHRcdFx0ZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChKU0VDYXB0Y2hhUGFzcyk7XG5cdFx0XHRzZWxmLkpTRUNhcHRjaGFDb21wbGV0ZWQgPSB0cnVlO1xuXHRcdH0sIChyZXMpID0+IHtcblx0XHRcdGxvYWRSYW5kb21HYW1lKCk7XG5cdFx0fSk7Ki9cblx0fTtcblxuXHQvKipcblx0ICogbG9hZFJhbmRvbUdhbWVcblx0ICogbG9hZHMgcmFuZG9tIGdhbWUgZml4ZWQgdG8gYXN0ZXJvaWRzIGZvciBub3cuLlxuXHQgKi9cblx0Y29uc3QgbG9hZFJhbmRvbUdhbWUgPSAoKSA9PiB7XG5cdFx0Ly9jb25zdCBnYW1lcyA9IFsnYXN0ZXJvaWRzLmpzJywgJ3RpY3RhY3RvZS5qcycsICdwaWxvdC5qcyddOyBcblx0XHRjb25zdCBnYW1lcyA9IFsnYXN0ZXJvaWRzLmpzJ107IFxuXHRcdGNvbnN0IGNob29zZW5HYW1lID0gZ2FtZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKmdhbWVzLmxlbmd0aCldO1xuXHRcdGxvYWRHYW1lKGNob29zZW5HYW1lLCAoZ2FtZUNvZGUpID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKGdhbWVDb2RlKTtcblx0XHRcdGNvbnN0IGdhbWUgPSBuZXcgRnVuY3Rpb24oZ2FtZUNvZGUpO1xuXHRcdFx0Z2FtZSgpO1xuXHRcdH0pO1xuXHR9XG5cblx0Ly9EYXRhXG4gXHRjb25zdCBtbERhdGEgPSB7XG5cdFx0bG9hZFRpbWU6IG5ldyBEYXRlKCkuZ2V0VGltZSgpLFxuXHRcdHRpY2tUaW1lOiAwLFxuXHRcdGZpbmlzaFRpbWU6IDAsXG5cdFx0bW91c2VYOiAwLFxuXHRcdG1vdXNlWTogMCxcblx0XHRtb3VzZVVwOiAwLFxuXHRcdG1vdXNlRG93bjogMCxcblx0XHRtb3VzZUxlZnQ6IDAsXG5cdFx0bW91c2VSaWdodDogMCxcblx0XHRtb3VzZUNsaWNrczogMCxcblx0XHRtb3VzZUV2ZW50czogMCxcblx0XHRtb3VzZVBhdHRlcm46IFtdLFxuXHRcdGdhbWVzQ29tcGxldGVkOiAwLFxuXHRcdGNoZWNrQm94OiAwXG5cdH07XG5cblx0bWxEYXRhLnVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuXHRtbERhdGEudXNlckFnZW50ID0gbmF2aWdhdG9yLnVzZXJBZ2VudCB8fCAwO1xuXHRtbERhdGEucGxhdGZvcm0gPSBuYXZpZ2F0b3IucGxhdGZvcm0gfHwgMDtcblx0bWxEYXRhLnJlZmVycmVyID0gZG9jdW1lbnQucmVmZXJyZXIgfHwgMDtcblx0bWxEYXRhLnJ1bk9uY2UgPSB3aW5kb3cuSlNFUnVuT25jZSB8fCBmYWxzZTtcblx0bWxEYXRhLmxhbmd1YWdlID0gd2luZG93Lm5hdmlnYXRvci5sYW5ndWFnZSB8fCAwO1xuXG5cdGlmIChuYXZpZ2F0b3IubGFuZ3VhZ2VzKSB7IFxuXHRcdG1sRGF0YS5sYW5ndWFnZXMgPSBuYXZpZ2F0b3IubGFuZ3VhZ2VzLmpvaW4oJycpIHx8IDA7XG5cdH0gZWxzZSB7XG5cdFx0bWxEYXRhLmxhbmd1YWdlcyA9IDE7XG5cdH1cblxuXHRtbERhdGEudGltZXpvbmVPZmZzZXQgPSBuZXcgRGF0ZSgpLmdldFRpbWV6b25lT2Zmc2V0KCkgfHwgMDtcblx0bWxEYXRhLmFwcE5hbWUgPSB3aW5kb3cubmF2aWdhdG9yLmFwcE5hbWUgfHwgMDtcblx0bWxEYXRhLnNjcmVlbldpZHRoID0gd2luZG93LnNjcmVlbi53aWR0aCB8fCAwO1xuXHRtbERhdGEuc2NyZWVuSGVpZ2h0ID0gd2luZG93LnNjcmVlbi5oZWlnaHQgfHwgMDtcblx0bWxEYXRhLnNjcmVlbkRlcHRoID0gd2luZG93LnNjcmVlbi5jb2xvckRlcHRoIHx8IDA7XG5cdG1sRGF0YS5zY3JlZW4gPSBtbERhdGEuc2NyZWVuV2lkdGgrJ3gnK21sRGF0YS5zY3JlZW5IZWlnaHQrJ3gnK21sRGF0YS5zY3JlZW5EZXB0aDsgLy8gMTkyMHgxMDgweDI0XG5cdG1sRGF0YS5pbm5lcldpZHRoID0gd2luZG93LmlubmVyV2lkdGggfHwgMDtcblx0bWxEYXRhLmlubmVySGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0IHx8IDA7XG5cdG1sRGF0YS5kZXZpY2VNZW1vcnkgPSBuYXZpZ2F0b3IuZGV2aWNlTWVtb3J5IHx8IG5hdmlnYXRvci5oYXJkd2FyZUNvbmN1cnJlbmN5IHx8IDA7XG5cdG1sRGF0YS5wcm90b1N0cmluZyA9IE9iamVjdC5rZXlzKG5hdmlnYXRvci5fX3Byb3RvX18pLmpvaW4oJycpLnN1YnN0cmluZygwLCAxMDApIHx8IDA7XG5cblx0aWYgKHdpbmRvdy5mcmFtZUVsZW1lbnQgPT09IG51bGwpIHtcblx0XHRtbERhdGEuaUZyYW1lID0gZmFsc2U7XG5cdH0gZWxzZSB7XG5cdFx0bWxEYXRhLmlGcmFtZSA9IHRydWU7XG5cdH1cblx0XG5cblxuXHQvL29uIGRldGFpbHMgb3BlblxuXHQkOiBpZiAob3Blbikge1xuXHRcdG1sRGF0YS50aWNrVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdGxvYWRSYW5kb21HYW1lKCk7XG5cdH0gZWxzZSB7XG5cblx0fVxuXG5cdC8vaW5wdXQgc2VsZWN0ZWRcblx0JDogbWxEYXRhLmNoZWNrQm94ID0gKGNhcHRjaGFDaGVjayk/MTowO1xuXG5cdC8vdHJhY2sgbW92ZW1lbnRcblx0Y29uc3QgaGFuZGxlTW92ZW1lbnQgPSAoZSkgPT4ge1xuXHRcdGNvbnN0IHJlY3QgPSBlLmN1cnJlbnRUYXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0aWYgKGUucGFnZVggPT09IG51bGwpIHtcblx0XHRcdGNvbnN0IGVEb2MgPSAoZS50YXJnZXQgJiYgZS50YXJnZXQub3duZXJEb2N1bWVudCkgfHwgZG9jdW1lbnQ7XG5cdFx0XHRjb25zdCBkb2MgPSBlRG9jLmRvY3VtZW50RWxlbWVudDtcblx0XHRcdGNvbnN0IGJvZHkgPSBlRG9jLmJvZHk7XG5cdFx0XHRlLnBhZ2VYID0gTWF0aC5mbG9vcigoZS50b3VjaGVzICYmIGUudG91Y2hlc1swXS5jbGllbnRYIHx8IGUuY2xpZW50WCB8fCAwKSArXG5cdFx0XHRcdChkb2MgJiYgZG9jLnNjcm9sbExlZnQgfHwgYm9keSAmJiBib2R5LnNjcm9sbExlZnQgfHwgMCkgLVxuXHRcdFx0XHQoZG9jICYmIGRvYy5jbGllbnRMZWZ0IHx8IGJvZHkgJiYgYm9keS5jbGllbnRMZWZ0IHx8IDApKTtcblx0XHRcdGUucGFnZVkgPSBNYXRoLmZsb29yKChlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdLmNsaWVudFkgfHwgZS5jbGllbnRZIHx8IDApICtcblx0XHRcdFx0KGRvYyAmJiBkb2Muc2Nyb2xsVG9wIHx8IGJvZHkgJiYgYm9keS5zY3JvbGxUb3AgfHwgMCkgLVxuXHRcdFx0XHQoZG9jICYmIGRvYy5jbGllbnRUb3AgfHwgYm9keSAmJiBib2R5LmNsaWVudFRvcCB8fCAwKSk7XG5cdFx0fVxuXHRcdGNvbnN0IG1vdXNlWCA9IGUucGFnZVggLSByZWN0LmxlZnQ7XG5cdFx0Y29uc3QgbW91c2VZID0gZS5wYWdlWSAtIHJlY3QudG9wO1xuXG5cdFx0bWxEYXRhLm1vdXNlRXZlbnRzICs9IDE7XG5cdFx0aWYgKG1vdXNlWSA8IG1sRGF0YS5tb3VzZVkpIG1sRGF0YS5tb3VzZURvd24gKz0gMTtcblx0XHRpZiAobW91c2VZID4gbWxEYXRhLm1vdXNlWSkgbWxEYXRhLm1vdXNlVXAgKz0gMTtcblx0XHRpZiAobW91c2VYID4gbWxEYXRhLm1vdXNlWCkgbWxEYXRhLm1vdXNlUmlnaHQgKz0gMTtcblx0XHRpZiAobW91c2VYIDwgbWxEYXRhLm1vdXNlWCkgbWxEYXRhLm1vdXNlTGVmdCArPSAxO1xuXG5cdFx0bWxEYXRhLm1vdXNlWCA9IG1vdXNlWDtcblx0XHRtbERhdGEubW91c2VZID0gbW91c2VZO1xuXHRcdG1sRGF0YS5tb3VzZVBhdHRlcm4ucHVzaChwYXJzZUludChtb3VzZVgpICsgJ3gnICsgcGFyc2VJbnQobW91c2VZKSk7XG5cdH1cblx0XG5cdGNvbnN0IGNhbGxiYWNrRnVuY3Rpb24gPSAoZSkgPT4ge1xuXHRcdGNvbnNvbGUubG9nKCdjb21wbGV0ZScpXG5cdFx0bWxEYXRhLmdhbWVzQ29tcGxldGVkICs9IDE7XG5cdFx0bWxEYXRhLm1vdXNlQ2xpY2tzID0gZS5kZXRhaWwubW91c2VDbGlja3M7XG5cdFx0bWxEYXRhLmZpbmlzaFRpbWUgPSBlLmRldGFpbC5maW5pc2hUaW1lOyBcblx0XHRcblx0XHQvL2Nsb3NlIGNhcHRjaGFcblx0XHRvcGVuID0gZmFsc2U7XG5cblx0XHQvL3N1Ym1pdCBkYXRhXG5cdFx0c3VibWl0TUxEYXRhKFxuXHRcdFx0KHJlcykgPT4ge1xuXHRcdFx0XHRjb25zdCBKU0VDYXB0Y2hhUGFzcyA9IHt9O1xuXHRcdFx0XHRKU0VDYXB0Y2hhUGFzcy5pcCA9IHJlcy5pcDtcblx0XHRcdFx0SlNFQ2FwdGNoYVBhc3MucmF0aW5nID0gcmVzLnJhdGluZztcblx0XHRcdFx0SlNFQ2FwdGNoYVBhc3MucGFzcyA9IHJlcy5wYXNzO1xuXHRcdFx0XHRcblx0XHRcdFx0ZGlzcGF0Y2goJ3N1Y2Nlc3MnLCBKU0VDYXB0Y2hhUGFzcyk7XG5cdFx0XHRcdGNvbXBsZXRlID0gdHJ1ZTtcblx0XHRcdH0sIFxuXHRcdFx0KHJlcykgPT4ge1xuXHRcdFx0XHRvcGVuID0gdHJ1ZTtcblx0XHRcdFx0ZGlzcGF0Y2goJ2ZhaWwnLCAxKTtcblx0XHRcdFx0bG9hZFJhbmRvbUdhbWUoKTtcblx0XHRcdH1cblx0XHQpO1xuXHR9XG5cblxuXHQvKipcblx0ICogc3VibWl0TUxEYXRhXG5cdCAqIHN1Ym1pdCBkYXRhIHdpdGggY2FsbGJhY2sgY29kZSBzdWNjZXMgZmFpbFxuICAgICAqIEBwYXJhbSB7Y2FsbGJhY2t9IHBhc3NDYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7Y2FsbGJhY2t9IGZhaWxDYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvblxuXHQgKi9cblx0Y29uc3Qgc3VibWl0TUxEYXRhID0gKHBhc3NDYWxsYmFjaywgZmFpbENhbGxiYWNrKSA9PiB7XG5cdFx0Y29uc3QgY2xlYW5EYXRhU3RyaW5nID0gcHJlcE1MRGF0YSgpO1xuXHRcdHRoaW5raW5nID0gdHJ1ZTtcblx0XHRyZXF1ZXN0VVJMKHtcbiAgICAgICAgICAgIG1ldGhvZDogJ3Bvc3QnLFxuXHRcdFx0dXJsOiBgJHtjYXB0Y2hhU2VydmVyfS9jYXB0Y2hhL3JlcXVlc3QvYCxcblx0XHRcdGNvbnRlbnQ6IGNsZWFuRGF0YVN0cmluZyxcblx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcblx0XHRcdH0sXG4gICAgICAgIC8vc3VjY2Vzc1xuICAgICAgICB9KS50aGVuKChyZXMpID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKCdbcmVzXVtsb2FkQ29uZl0nLHJlcyk7XG5cdFx0XHR0aGlua2luZyA9IGZhbHNlO1xuXHRcdFx0cmVzID0gSlNPTi5wYXJzZShyZXMuY29udGVudCk7XG5cdFx0XHRpZiAoKHJlcy5wYXNzKSAmJiAocmVzLnBhc3MgPT09IHRydWUpKSB7XG5cdFx0XHRcdHBhc3NDYWxsYmFjayhyZXMpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZmFpbENhbGxiYWNrKHJlcyk7XG5cdFx0XHR9XG4gICAgICAgIC8vZXJyb3JcbiAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0Y29uc29sZS5lcnJvcihlcnIpO1xuXHRcdFx0ZmFpbENhbGxiYWNrKHJlcyk7XG5cdFx0fSk7XG5cdH07XG5cblx0LyoqXG5cdCAqIHByZXBNTERhdGFcblx0ICogUHJlcGFyZSBNTCBkYXRhXG5cdCAqL1xuXHRjb25zdCBwcmVwTUxEYXRhID0gKCkgPT4ge1xuXHRcdGNvbnN0IGNsZWFuRGF0YSA9IG1sRGF0YTtcblx0XHRjbGVhbkRhdGEubW91c2VQYXR0ZXJuID0gY2xlYW5EYXRhLm1vdXNlUGF0dGVybi5zbGljZShjbGVhbkRhdGEubW91c2VQYXR0ZXJuLmxlbmd0aC0yMDAsY2xlYW5EYXRhLm1vdXNlUGF0dGVybi5sZW5ndGgpO1xuXHRcdHJldHVybiBKU09OLnN0cmluZ2lmeSh7bWxEYXRhOiBjbGVhbkRhdGF9KTtcblx0fTtcbjwvc2NyaXB0PlxuXG5cblxuXG5cbjxzdHlsZSBnbG9iYWw+XG4vKipcbiogRkxBVFxuKiovXG46Z2xvYmFsKCNKU0UtQ2FwdGNoYS5mbGF0KSB7XG5cdGJhY2tncm91bmQ6IG5vbmU7XG5cdHBhZGRpbmc6IDBweDtcbn1cblxuOmdsb2JhbCgjSlNFLUNhcHRjaGEuZmxhdCBkZXRhaWxzKSB7XG5cdGJveC1zaGFkb3c6IDBweCAwcHggMHB4IDRweCByZ2JhKDAsIDAsIDAsIDAuMDYpO1xufVxuXG4vKioqKi9cblxuXG4vKipcbiogU01BTExcbioqL1xuOmdsb2JhbCgjSlNFLUNhcHRjaGEuUykge1xuXHRib3JkZXItcmFkaXVzOiA2cHg7XG5cdHBhZGRpbmc6IDhweDtcblx0bWFyZ2luOiA1cHg7XG5cdGZvbnQtc2l6ZTogMTFweDtcbn1cblxuOmdsb2JhbCgjSlNFLUNhcHRjaGEuUyAjSlNFLWlucHV0KSB7XG5cdGhlaWdodDogMjBweDtcblx0bWluLXdpZHRoOiAyMHB4O1xuXHRmb250LXNpemU6IDE1cHg7XG5cdGJvcmRlcjogc29saWQgMXB4ICNEM0Q4REQ7XG5cdHBhZGRpbmc6IDFweDtcblx0bWFyZ2luOiA2cHg7XG59XG5cbjpnbG9iYWwoI0pTRS1DYXB0Y2hhLlMgI0pTRS1icmFuZCkge1xuXHR3aWR0aDogMzBweDtcbiAgICBoZWlnaHQ6IDM4cHg7XG5cdGJvcmRlci1sZWZ0OiBzb2xpZCAycHggI0Y5RjlGOTtcbn1cblxuOmdsb2JhbCgjSlNFLUNhcHRjaGEuUyAjSlNFLWJyYW5kIHN2Zykge1xuXHR3aWR0aDogMjRweDtcbn1cblxuOmdsb2JhbCgjSlNFLUNhcHRjaGEuUy5mbGF0IGRldGFpbHMpIHtcblx0Ym94LXNoYWRvdzogMHB4IDBweCAwcHggMnB4IHJnYmEoMCwgMCwgMCwgMC4wNik7XG59XG46Z2xvYmFsKCNKU0UtQ2FwdGNoYS5TLnN1Y2Nlc3MgI0pTRS1pbnB1dCkge1xuXHRtaW4td2lkdGg6NTJweDtcbn1cbi8qKioqL1xuXG4vKipcbiogTUVESVVNXG4qKi9cbjpnbG9iYWwoI0pTRS1DYXB0Y2hhLk0pIHtcblx0Ym9yZGVyLXJhZGl1czogNnB4O1xuXHRwYWRkaW5nOiA4cHg7XG5cdG1hcmdpbjogNXB4O1xuXHRmb250LXNpemU6IDE2cHg7XG59XG5cbjpnbG9iYWwoI0pTRS1DYXB0Y2hhLk0gI0pTRS1pbnB1dCkge1xuXHRoZWlnaHQ6IDMwcHg7XG5cdG1pbi13aWR0aDogMzBweDtcblx0Zm9udC1zaXplOiAyMHB4O1xuXHRib3JkZXI6IHNvbGlkIDJweCAjRDNEOEREO1xuXHRtYXJnaW46IDhweDtcbn1cblxuOmdsb2JhbCgjSlNFLUNhcHRjaGEuTSAjSlNFLWJyYW5kKSB7XG5cdHdpZHRoOiAzOHB4O1xuXHRib3JkZXItbGVmdDogc29saWQgMnB4ICNGOUY5Rjk7XG5cdGhlaWdodDo1MHB4O1xufVxuXG46Z2xvYmFsKCNKU0UtQ2FwdGNoYS5NICNKU0UtYnJhbmQgc3ZnKSB7XG5cdHdpZHRoOiAzNHB4O1xufVxuXG46Z2xvYmFsKCNKU0UtQ2FwdGNoYS5NLmZsYXQgZGV0YWlscykge1xuXHRib3gtc2hhZG93OiAwcHggMHB4IDBweCAycHggcmdiYSgwLCAwLCAwLCAwLjA2KTtcbn1cbjpnbG9iYWwoI0pTRS1DYXB0Y2hhLk0uc3VjY2VzcyAjSlNFLWlucHV0KSB7XG5cdG1pbi13aWR0aDo3MHB4O1xufVxuLyoqKiovXG5cbi8qKlxuKiBMQVJHRVxuKiovXG46Z2xvYmFsKCNKU0UtQ2FwdGNoYS5MKSB7fVxuXG46Z2xvYmFsKCNKU0UtQ2FwdGNoYS5zdWNjZXNzICNKU0UtaW5wdXQpIHtcblx0bWluLXdpZHRoOjkycHg7XG59XG46Z2xvYmFsKCNKU0UtQ2FwdGNoYSAjSlNFLWJyYW5kKSB7XG5cdGhlaWdodDo2OHB4XG59XG4vKioqKi9cblxuXG4vKipcbiogQkFTRVxuKiovXG46Z2xvYmFsKCNjYXB0Y2hhQ2hlY2spIHsgXG5cdGRpc3BsYXk6bm9uZTtcbn1cbjpnbG9iYWwoI0pTRS1DYXB0Y2hhKSB7XG5cdGRpc3BsYXk6bm9uZTtcblx0YmFja2dyb3VuZDogI0YyRjhGRjtcblx0Ym9yZGVyLXJhZGl1czogNnB4O1xuXHRjbGVhcjogYm90aDtcblx0cGFkZGluZzogMTNweDtcblx0bWFyZ2luOiAxMHB4O1xuXHRtaW4td2lkdGg6IDIwMHB4O1xuXHRtYXgtd2lkdGg6IDMxNHB4O1xuXHRjb2xvcjogIzcwNzA3MDtcblx0Zm9udC1zaXplOiAyMHB4O1xuXHRmb250LWZhbWlseTogJ01vbnRzZXJyYXQnLCBzYW5zLXNlcmlmO1xufVxuXG46Z2xvYmFsKCNKU0UtQ2FwdGNoYSAqKSB7XG5cdC13ZWJraXQtdXNlci1zZWxlY3Q6IG5vbmU7XG5cdCAgIC1tb3otdXNlci1zZWxlY3Q6IG5vbmU7XG5cdCAgICAtbXMtdXNlci1zZWxlY3Q6IG5vbmU7XG5cdCAgICAgICAgdXNlci1zZWxlY3Q6IG5vbmU7XG59XG5cbjpnbG9iYWwoI0pTRS1DYXB0Y2hhIGRldGFpbHMpIHtcblx0b3ZlcmZsb3c6IGhpZGRlbjtcblx0bWFyZ2luOiAwcHg7XG5cdGJhY2tncm91bmQ6ICNmZmY7XG5cdGJvcmRlci1yYWRpdXM6IDRweDtcblx0Ym94LXNoYWRvdzogMHB4IDNweCA2cHggMHB4IHJnYmEoMCwgMCwgMCwgMC4xMik7XG59XG5cbjpnbG9iYWwoI0pTRS1DYXB0Y2hhIGRldGFpbHMgc3VtbWFyeSkge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRvdXRsaW5lOiBub25lO1xufVxuXG46Z2xvYmFsKCNKU0UtQ2FwdGNoYSBkZXRhaWxzICNKU0UtQ2FwdGNoYURpc3BsYXkpIHtcblx0b3BhY2l0eTogMDtcblx0bWFyZ2luOiAwcHg7XG5cdHBhZGRpbmc6IDBweDtcblx0aGVpZ2h0OiAwcHg7XG5cdHRyYW5zaXRpb246IG9wYWNpdHkgMC4ycywgaGVpZ2h0IDAuNHM7XG5cdGJhY2tncm91bmQ6ICNmZmY7XG59XG5cbjpnbG9iYWwoI0pTRS1DYXB0Y2hhIGRldGFpbHMuY2FwdGNoYVBhbmVsW29wZW5dICNKU0UtQ2FwdGNoYURpc3BsYXkpIHtcblx0LXdlYmtpdC1hbmltYXRpb24tbmFtZTogc2xpZGVEb3duO1xuXHQgICAgICAgIGFuaW1hdGlvbi1uYW1lOiBzbGlkZURvd247XG5cdC13ZWJraXQtYW5pbWF0aW9uLWR1cmF0aW9uOiAwLjNzO1xuXHQgICAgICAgIGFuaW1hdGlvbi1kdXJhdGlvbjogMC4zcztcblx0LXdlYmtpdC1hbmltYXRpb24tZmlsbC1tb2RlOiBmb3J3YXJkcztcblx0ICAgICAgICBhbmltYXRpb24tZmlsbC1tb2RlOiBmb3J3YXJkcztcblx0LXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IDAuM3M7XG5cdCAgICAgICAgYW5pbWF0aW9uLWRlbGF5OiAwLjNzO1xufVxuXG46Z2xvYmFsKCNKU0UtQ2FwdGNoYSAjSlNFLWlucHV0KSB7XG5cdGJvcmRlcjogc29saWQgNHB4ICNEM0Q4REQ7XG5cdGJvcmRlci1yYWRpdXM6IDRweDtcblx0bWFyZ2luOiAxMHB4O1xuXHRtaW4td2lkdGg6IDQwcHg7XG5cdGhlaWdodDogNDBweDtcblx0Y3Vyc29yOiBwb2ludGVyO1xuXHRmb250LXNpemU6IDI4cHg7XG5cdHRleHQtYWxpZ246IGNlbnRlcjtcblx0cG9zaXRpb246IHJlbGF0aXZlO1xuXHRvdmVyZmxvdzogaGlkZGVuO1xufVxuXG46Z2xvYmFsKCNKU0UtQ2FwdGNoYSBkZXRhaWxzPnN1bW1hcnk6Oi13ZWJraXQtZGV0YWlscy1tYXJrZXIpIHtcblx0ZGlzcGxheTogbm9uZTtcbn1cblxuOmdsb2JhbCgjSlNFLUNhcHRjaGEgZGV0YWlscyAjSlNFLWlucHV0OmhvdmVyOmJlZm9yZSkge1xuXHRjb250ZW50OiAn8J+klic7XG5cdG9wYWNpdHk6IDE7XG59XG5cbjpnbG9iYWwoI0pTRS1DYXB0Y2hhLnN1Y2Nlc3MgZGV0YWlscyAjSlNFLWlucHV0OmJlZm9yZSkge1xuXHRjb250ZW50OiAn8J+YiSc7XG5cdG9wYWNpdHk6IDE7XG59XG46Z2xvYmFsKCNKU0UtQ2FwdGNoYS5mYWlsZWQgZGV0YWlscyAjSlNFLWlucHV0OmJlZm9yZSkge1xuXHRjb250ZW50OiAn8J+klic7XG5cdG9wYWNpdHk6IDE7XG59XG5cbjpnbG9iYWwoI0pTRS1DYXB0Y2hhLnRoaW5raW5nIGRldGFpbHMgI0pTRS1pbnB1dDpiZWZvcmUpIHtcblx0Y29udGVudDogJ/CfpKEnO1xuXHRvcGFjaXR5OiAxO1xufVxuOmdsb2JhbCgjSlNFLUNhcHRjaGEuc3VjY2VzcyBkZXRhaWxzICNKU0UtaW5wdXQ6YWZ0ZXIpIHtcblx0Y29udGVudDogJ+KclCc7XG5cdG9wYWNpdHk6IDE7XG5cdGNvbG9yOiAjMjZBRTYwO1xuXHRwYWRkaW5nOiAwcHggNHB4IDBweCA1cHg7XG5cdGJvcmRlci1sZWZ0OiBzb2xpZCAycHggI0QzRDhERDtcbn1cblxuOmdsb2JhbCgjSlNFLUNhcHRjaGEuZmFpbGVkIGRldGFpbHMgI0pTRS1pbnB1dDphZnRlcikge1xuXHRjb250ZW50OiAn4puUJztcblx0b3BhY2l0eTogMTtcblx0cGFkZGluZzogMHB4O1xuXHRib3JkZXItbGVmdDogc29saWQgMnB4ICNEM0Q4REQ7XG59XG5cblxuOmdsb2JhbCgjSlNFLUNhcHRjaGEuc3VjY2VzcyBkZXRhaWxzLmNhcHRjaGFQYW5lbFtvcGVuXSAjSlNFLWlucHV0OmFmdGVyKSB7XG5cdGNvbnRlbnQ6ICcnO1xuXHRvcGFjaXR5OiAwO1xuXHRwYWRkaW5nOiAwcHg7XG5cdGJvcmRlcjogMHB4O1xuXHRcbn1cblxuOmdsb2JhbCgjSlNFLUNhcHRjaGEgZGV0YWlscyAjSlNFLWlucHV0OmJlZm9yZSksXG46Z2xvYmFsKCNKU0UtQ2FwdGNoYSBkZXRhaWxzLmNhcHRjaGFQYW5lbFtvcGVuXSAjSlNFLWlucHV0OmJlZm9yZSkge1xuXHRvcGFjaXR5OiAwO1xuXHQvKmZvbnQtc2l6ZTogMjhweDsqL1xuXHRjb250ZW50OiAn8J+klic7XG5cdHRyYW5zaXRpb246IG9wYWNpdHkgMC4ycztcblx0cG9zaXRpb246IGFic29sdXRlO1xuXHR0b3A6MHB4O1xuXHRsZWZ0OjBweDtcblx0Ym90dG9tOjBweDtcblx0cmlnaHQ6MHB4O1xuXHRiYWNrZ3JvdW5kOiNmZmY7XG59XG46Z2xvYmFsKCNKU0UtQ2FwdGNoYS5zdWNjZXNzIGRldGFpbHMuY2FwdGNoYVBhbmVsICNKU0UtaW5wdXQ6YmVmb3JlKSB7XG5cdHJpZ2h0OjUwJTtcbn1cbjpnbG9iYWwoI0pTRS1DYXB0Y2hhLnN1Y2Nlc3MgZGV0YWlscy5jYXB0Y2hhUGFuZWxbb3Blbl0gI0pTRS1pbnB1dDphZnRlcikge1xuXHRkaXNwbGF5OiBub25lO1xufVxuOmdsb2JhbCgjSlNFLUNhcHRjaGEuc3VjY2VzcyBkZXRhaWxzLmNhcHRjaGFQYW5lbCAjSlNFLWlucHV0OmFmdGVyKSB7XG5cdGxlZnQ6NTAlO1xuXHRwb3NpdGlvbjogYWJzb2x1dGU7XG5cdHRvcDowcHg7XG5cdGJvdHRvbTowcHg7XG5cdHJpZ2h0OjBweDtcblx0YmFja2dyb3VuZDojZmZmO1xufVxuOmdsb2JhbCgjSlNFLUNhcHRjaGEuc3VjY2VzcyAjSlNFLWlucHV0KSB7XG5cdG1pbi13aWR0aDo5MnB4O1xufVxuOmdsb2JhbCgjSlNFLUNhcHRjaGEuc3VjY2VzcyBkZXRhaWxzLmNhcHRjaGFQYW5lbFtvcGVuXSAjSlNFLWlucHV0KSB7XG5cdG1pbi13aWR0aDoyMHB4O1xufVxuXG46Z2xvYmFsKCNKU0UtQ2FwdGNoYSBkZXRhaWxzLmNhcHRjaGFQYW5lbFtvcGVuXSAjSlNFLWlucHV0OmJlZm9yZSkge1xuXHRvcGFjaXR5OiAxO1xufVxuXG46Z2xvYmFsKCNKU0UtQ2FwdGNoYSAjSlNFLW1zZykge1xuXHRhbGlnbi1zZWxmOiBjZW50ZXI7XG5cdHBhZGRpbmc6IDBweCAwcHggMHB4IDRweDtcblx0ZmxleDogMTtcbn1cblxuOmdsb2JhbCgjSlNFLUNhcHRjaGEgI0pTRS1tc2cgcCkge1xuXHR2ZXJ0aWNhbC1hbGlnbjogYm90dG9tO1xuXHRkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG5cdG1hcmdpbjogMHB4O1xuXHRsaW5lLWhlaWdodDogMS4yO1xufVxuXG46Z2xvYmFsKCNKU0UtQ2FwdGNoYSAjSlNFLWJyYW5kKSB7XG5cdGJvcmRlci1sZWZ0OiBzb2xpZCAzcHggI0Y5RjlGOTtcblx0YWxpZ24tc2VsZjogY2VudGVyO1xuXHR3aWR0aDogNjBweDtcblx0aGVpZ2h0OjY4cHg7XG5cdHBhZGRpbmc6IDBweCA0cHg7XG5cdHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIGFsaWduLWNvbnRlbnQ6IGNlbnRlcjtcbn1cblxuOmdsb2JhbCgjSlNFLUNhcHRjaGEgI0pTRS1icmFuZCBzdmcpIHtcblx0ZmlsbDogIzUxQkZFQztcblx0d2lkdGg6IDQ4cHg7XG59XG5cbjpnbG9iYWwoI0pTRS1DYXB0Y2hhICNKU0UtQ2FwdGNoYURpc3BsYXkgI0pTRS1jYXB0Y2hhLWdhbWUtY29udGFpbmVyKSB7XG5cdGJhY2tncm91bmQ6ICNGMkY4RkY7XG5cdGJvcmRlci1yYWRpdXM6IDZweDtcblx0aGVpZ2h0OiAxMDAlO1xuXHRwb3NpdGlvbjpyZWxhdGl2ZTtcblx0b3ZlcmZsb3c6aGlkZGVuO1xufVxuOmdsb2JhbCgjSlNFLUNhcHRjaGEgI0pTRS1DYXB0Y2hhRGlzcGxheSAjSlNFLWNhcHRjaGEtZ2FtZSkge1xuXHRoZWlnaHQ6MTAwJTtcbn1cblxuXG5ALXdlYmtpdC1rZXlmcmFtZXMgc2xpZGVEb3duIHtcblx0Omdsb2JhbChmcm9tKSB7XG5cdFx0b3BhY2l0eTogMDtcblx0XHRoZWlnaHQ6IDA7XG5cdFx0cGFkZGluZzogOHB4O1xuXHRcdGJvcmRlci10b3A6IHNvbGlkIDRweCAjRjlGOUY5O1xuXHR9XG5cblx0Omdsb2JhbCh0bykge1xuXHRcdG9wYWNpdHk6IDE7XG5cdFx0aGVpZ2h0OiAxOTBweDtcblx0XHRwYWRkaW5nOiA4cHg7XG5cdFx0Ym9yZGVyLXRvcDogc29saWQgNHB4ICNGOUY5Rjk7XG5cdFx0LypoZWlnaHQ6IHZhcigtLWNvbnRlbnRIZWlnaHQpOyovXG5cdH1cbn1cblxuXG5Aa2V5ZnJhbWVzIHNsaWRlRG93biB7XG5cdGZyb20ge1xuXHRcdG9wYWNpdHk6IDA7XG5cdFx0aGVpZ2h0OiAwO1xuXHRcdHBhZGRpbmc6IDhweDtcblx0XHRib3JkZXItdG9wOiBzb2xpZCA0cHggI0Y5RjlGOTtcblx0fVxuXG5cdHRvIHtcblx0XHRvcGFjaXR5OiAxO1xuXHRcdGhlaWdodDogMTkwcHg7XG5cdFx0cGFkZGluZzogOHB4O1xuXHRcdGJvcmRlci10b3A6IHNvbGlkIDRweCAjRjlGOUY5O1xuXHRcdC8qaGVpZ2h0OiB2YXIoLS1jb250ZW50SGVpZ2h0KTsqL1xuXHR9XG59XG5cbjpnbG9iYWwoI0pTRS1DYXB0Y2hhIGRldGFpbHMgI0pTRS1tc2c+cDphZnRlcikge1xuXHRjb250ZW50OiAnSW0gaHVtYW4nO1xufVxuXG46Z2xvYmFsKCNKU0UtQ2FwdGNoYSBkZXRhaWxzLmNhcHRjaGFQYW5lbFtvcGVuXSAjSlNFLW1zZz5wOmFmdGVyKSxcbjpnbG9iYWwoI0pTRS1DYXB0Y2hhLnN1Y2Nlc3MgZGV0YWlscy5jYXB0Y2hhUGFuZWxbb3Blbl0gI0pTRS1tc2c+cDphZnRlcikge1xuXHRjb250ZW50OiAnSW0gbm90IGEgcm9ib3QnO1xufVxuXG46Z2xvYmFsKCNKU0UtQ2FwdGNoYS5zdWNjZXNzIGRldGFpbHMgI0pTRS1tc2c+cDphZnRlcikge1xuXHRjb250ZW50OiAnVmVyaWZpZWQgaHVtYW4nO1xufVxuOmdsb2JhbCgjSlNFLUNhcHRjaGEuZmFpbGVkIGRldGFpbHMgI0pTRS1tc2c+cDphZnRlcikge1xuXHRjb250ZW50OiAnRmFpbGVkIHZlcmlmaWNhdGlvbic7XG59XG46Z2xvYmFsKCNKU0UtQ2FwdGNoYS50aGlua2luZyBkZXRhaWxzICNKU0UtbXNnPnA6YWZ0ZXIpIHtcblx0Y29udGVudDogJ1ZlcmlmeWluZyAuLi4nO1xufVxuXG46Z2xvYmFsKCNKU0UtaW5wdXQgaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdKSB7XG5cdC8qcG9zaXRpb246IGFic29sdXRlO1xuXHR0b3A6IC01MHB4OyovXG59XG46Z2xvYmFsKCNKU0UtQ2FwdGNoYS5hY3RpdmUpIHtcblx0ZGlzcGxheTpibG9jaztcbn1cbi8qKioqL1xuXG5cbjpnbG9iYWwoLmdmeCkge1xuXHRwb3NpdGlvbjphYnNvbHV0ZTtcblx0b3BhY2l0eToxO1xuXHR0cmFuc2l0aW9uOiBvcGFjaXR5IDAuNnM7XG59XG5cbjpnbG9iYWwoLmdmeC5hY3RpdmUpIHtcblx0b3BhY2l0eTowO1xufVxuXG5cbjpnbG9iYWwoLmdhbWUpIHtcblx0aGVpZ2h0OjEwMCU7XG5cdGJhY2tncm91bmQtc2l6ZTozNTBweDtcblx0YmFja2dyb3VuZC1yZXBlYXQ6bm8tcmVwZWF0O1xuXHRiYWNrZ3JvdW5kLWltYWdlOnVybChcImRhdGE6aW1hZ2Uvc3ZnK3htbCwlM0NzdmcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJyB3aWR0aD0nMjU0LjczMicgaGVpZ2h0PScxNDIuNjUnIHZpZXdCb3g9JzAgMCAyNTQuNzMyIDE0Mi42NSclM0UlM0NyZWN0IHdpZHRoPScyNTQuNzMyJyBoZWlnaHQ9JzE0Mi42NScgZmlsbD0nJTIzMjYxMzZlJy8lM0UlM0NnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEzLjc5OSA4LjMyNiknJTNFJTNDZyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSg2Ni43MjUgMTYuMTU3KSclM0UlM0NwYXRoIGQ9J002MDAuMDQyLDI2MS44ODNBNDYuODQyLDQ2Ljg0MiwwLDEsMCw1NTMuMiwyMTUuMDQyYTQ2LjkzLDQ2LjkzLDAsMCwwLDQ2Ljg0Miw0Ni44NDJaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNTUzLjIgLTE2OC4yKScgZmlsbD0nJTIzMzMxMTc4JyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTYzNy4wMzksMjkyLjU3OEE0MC41MzksNDAuNTM5LDAsMSwwLDU5Ni41LDI1Mi4wMzlhNDAuNjE2LDQwLjYxNiwwLDAsMCw0MC41MzksNDAuNTM5WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTU5MC4xOTcgLTIwNS4xOTcpJyBmaWxsPSclMjMzYTE1ODAnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNNjk0LjU0MiwzNDAuMjg1QTMwLjc0MywzMC43NDMsMCwxLDAsNjYzLjgsMzA5LjU0M2EzMC44MDcsMzAuODA3LDAsMCwwLDMwLjc0MiwzMC43NDNaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNjQ3LjcwMSAtMjYyLjcwMSknIGZpbGw9JyUyMzQ0MTU4ZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J003NTEuNTM0LDM4Ny41NjdBMjEuMDM0LDIxLjAzNCwwLDEsMCw3MzAuNSwzNjYuNTM0YTIxLjA3MiwyMS4wNzIsMCwwLDAsMjEuMDM0LDIxLjAzNFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC03MDQuNjkyIC0zMTkuNjkyKScgZmlsbD0nJTIzNTIxYjk2JyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQy9nJTNFJTNDZyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgwKSclM0UlM0NwYXRoIGQ9J00xMTIuNDEzLDkyLjQxMUExNy42MDYsMTcuNjA2LDAsMSwwLDk0LjgsNzQuOGExNy42NDMsMTcuNjQzLDAsMCwwLDE3LjYxMywxNy42MTNaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtOTQuOCAtNTcuMiknIGZpbGw9JyUyMzM0MTI3MCcgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xMjYuMzQsMTAzLjk2NmExNS4yMzMsMTUuMjMzLDAsMSwwLTE1LjI0LTE1LjI0LDE1LjI2LDE1LjI2LDAsMCwwLDE1LjI0LDE1LjI0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTEwOC43MjcgLTcxLjEyNyknIGZpbGw9JyUyMzNkMTI3MycgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNDcuOTU4LDEyMS45QTExLjU1LDExLjU1LDAsMSwwLDEzNi40LDExMC4zNDMsMTEuNTczLDExLjU3MywwLDAsMCwxNDcuOTU4LDEyMS45WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTEzMC4zNDUgLTkyLjc0NSknIGZpbGw9JyUyMzQ5MTI3OScgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNjkuNCwxMzkuNjA4YTcuOSw3LjksMCwxLDAtNy45LTcuOSw3LjkyMSw3LjkyMSwwLDAsMCw3LjksNy45WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTE1MS43OTEgLTExNC4xMDYpJyBmaWxsPSclMjM1NTE0N2YnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDL2clM0UlM0NnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDE5MS43NzcgMTQuOTA1KSclM0UlM0NwYXRoIGQ9J00xNDE4Ljk1MiwxNzIuOWE2LjY1Miw2LjY1MiwwLDEsMC02LjY1Mi02LjY1Miw2LjY2LDYuNjYsMCwwLDAsNi42NTIsNi42NTJaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTQxMi4zIC0xNTkuNiknIGZpbGw9JyUyMzM0MTI3MCcgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNDI0LjI0OSwxNzcuMzE0YTUuNzU3LDUuNzU3LDAsMSwwLTUuNzUtNS43NSw1Ljc3NCw1Ljc3NCwwLDAsMCw1Ljc1LDUuNzVaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTQxNy41OTcgLTE2NC44OTgpJyBmaWxsPSclMjMzZDEyNzMnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTQzMi4zNjcsMTg0LjAzNGE0LjM2Nyw0LjM2NywwLDEsMC00LjM2Ny00LjM2Nyw0LjM4LDQuMzgsMCwwLDAsNC4zNjcsNC4zNjdaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTQyNS43MTUgLTE3My4wMTUpJyBmaWxsPSclMjM0OTEyNzknIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTQ0MC40ODQsMTkwLjc2OGEyLjk4NCwyLjk4NCwwLDEsMC0yLjk4NC0yLjk4NCwyLjk4OCwyLjk4OCwwLDAsMCwyLjk4NCwyLjk4NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xNDMzLjgzMiAtMTgxLjEzMiknIGZpbGw9JyUyMzU1MTQ3ZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0MvZyUzRSUzQy9nJTNFJTNDZyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxOTguOTk3IDY1LjQ4OCknJTNFJTNDcGF0aCBkPSdNMTM3Ny40MzMsNDcwLjM4YTEwLjI0LDEwLjI0LDAsMSwwLTEwLjIzMy0xMC4yNDcsMTAuMjYzLDEwLjI2MywwLDAsMCwxMC4yMzMsMTAuMjQ3WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTEzNjcuMTg1IC00NDkuOSknIGZpbGw9JyUyM2Y2NicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xMzkxLjA3Niw0NDkuOWExMC4yNCwxMC4yNCwwLDEsMSwwLDIwLjQ4Yy0xLjAzMy0uMjc3LTMuMi0uNDUxLTIuODUzLTEuNDEyLjE3NS0uNDgsMS41NDMuMTg5LDIuOS4zMDYsMS44MDUuMTMxLDMuNy0uMjMzLDMuOTE2LS44MTUuMzA2LS44NzMtMS44NjMtLjI5MS00LjM2Ny0uNDIyLTIuOTY5LS4xNi02LjM3Ni0xLjAzMy02LjI4OC0yLjQxNi4wNzMtMS4wNDgsMy4wNTcuMzA2LDYsLjU2OCwzLC4yNzcsNS45NTMtLjU1Myw2LjExNC0yLjMuMTYtMS43NzYtMi43MzctMS4zMjUtNi4wODQtMS40LTMuMTMtLjA3My03LjEtMS4xMzUtNy4yMzQtMy4wMjgtLjE0Ni0yLjAzOCwzLjA1Ny0xLjE5NCw2LjA4NC0xLjI1MiwzLjA1Ny0uMDU4LDUuOTUzLTEuMDM0LDUuNDE1LTMuMDcxLS4yOTEtMS4xMDYtMi4xMTEtLjQwOC00LjM2Ny0uMzA2cy00Ljk5My0uMzc4LTUuMTY3LTEuMzFjLS4zMi0xLjc0NywzLjc4NC0zLjQwNiw1LjkzOS0zLjYyNVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMzgwLjgyOSAtNDQ5LjkpJyBmaWxsPSclMjNjNDNmNTcnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTM3Ny4zNDgsNDQ5LjljLjMzNSwwLC42Ny4wMTUuOTkuMDQ0aC0uMjMzYTEwLjI1LDEwLjI1LDAsMCwwLS45OSwyMC40NTEsMTAuMjQ5LDEwLjI0OSwwLDAsMSwuMjMzLTIwLjVaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTM2Ny4xIC00NDkuOSknIGZpbGw9JyUyM2RmOTlmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0MvZyUzRSUzQ2cgdHJhbnNmb3JtPSd0cmFuc2xhdGUoNzIuMjcxIDM0LjMzOCknJTNFJTNDcGF0aCBkPSdNNDk4LjcyNywyNDAuMzU0YTIuMjI3LDIuMjI3LDAsMSwwLTIuMjI3LTIuMjI3LDIuMjM2LDIuMjM2LDAsMCwwLDIuMjI3LDIuMjI3WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTQ5Ni41IC0yMzUuOSknIGZpbGw9JyUyMzdjMTM3MCcgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J001MDUuNTg5LDIzOC4zMTVhMi4yMjgsMi4yMjgsMCwwLDEtMS4yMjMsNC4wOSwxLjU4MiwxLjU4MiwwLDAsMS0uMjYyLS4wMTUsMi4yMjgsMi4yMjgsMCwwLDEsMS4yMjMtNC4wOWMuMDg3LDAsLjE3NS4wMTUuMjYyLjAxNVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC01MDIuMTM5IC0yMzcuOTUxKScgZmlsbD0nJTIzYmUyMzg1JyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQy9nJTNFJTNDZyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMTIuMDI0IDU1Ljk4MyknJTNFJTNDcGF0aCBkPSdNNzg0Ljk0Miw0MTUuMjg0QTE1LjM0MiwxNS4zNDIsMCwxLDAsNzY5LjYsMzk5Ljk0MmExNS4zNzIsMTUuMzcyLDAsMCwwLDE1LjM0MiwxNS4zNDJaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNzY5LjYgLTM4NC42KScgZmlsbD0nJTIzNjgzOGE0JyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTgwNC4xNjcsNDMxLjIzNEExMi4wNjcsMTIuMDY3LDAsMSwwLDc5Mi4xLDQxOS4xNjdhMTIuMDkyLDEyLjA5MiwwLDAsMCwxMi4wNjcsMTIuMDY3WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTc4OC44MjUgLTQwMy44MjUpJyBmaWxsPSclMjM3OTRkYWUnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNODE5LjcxOCw0NDQuMTM2YTkuNDE4LDkuNDE4LDAsMSwwLTkuNDE4LTkuNDE4LDkuNDMzLDkuNDMzLDAsMCwwLDkuNDE4LDkuNDE4WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTgwNC4zNzYgLTQxOS4zNzYpJyBmaWxsPSclMjM5ZTdlYzUnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNODI3LjE1MSw0NTAuM0E4LjE1MSw4LjE1MSwwLDEsMCw4MTksNDQyLjE1MWE4LjE2Niw4LjE2NiwwLDAsMCw4LjE1MSw4LjE1MVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC04MTEuODA5IC00MjYuODA5KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQy9nJTNFJTNDZyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSg0NC4xMzQgMTE0LjEyKSclM0UlM0NwYXRoIGQ9J00zMDMuOTg0LDg4OC4xNDdhLjc1NS43NTUsMCwwLDEsLjM5My4xYy4xMTYuMDczLDEzLjk3NC03Ljc3MywxNC4wNDctNy42NTZzLTEzLjYyNSw4LjIxLTEzLjYyNSw4LjM3YS44LjgsMCwxLDEtMS42LDAsLjc5Ljc5LDAsMCwxLC43ODYtLjgxNVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0zMDMuMTk3IC04NjYuNTMxKScgZmlsbD0nJTIzZmZjJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTMwNC45MjYsOTM0Ljk1MmEuNjI2LjYyNiwwLDEsMCwwLTEuMjUyLjYyMS42MjEsMCwwLDAtLjYyNi42MjYuNjMxLjYzMSwwLDAsMCwuNjI2LjYyNlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0zMDQuMTM5IC05MTEuOTA5KScgZmlsbD0nJTIzZmY2JyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTMwNS44MjIsOTM2LjM0NGEuNDIyLjQyMiwwLDEsMC0uNDIyLS40MjIuNDIyLjQyMiwwLDAsMCwuNDIyLjQyMlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0zMDUuMDc5IC05MTMuNDQ3KScgZmlsbD0nJTIzZmMwJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTQyNS45NDMsNzk2LjM3MmMuMDI5LS4wMTUsMjEuMzY4LTEyLjQxNiwyMS40LTEyLjM3M3MtMjEuMjA4LDEyLjU5MS0yMS4yNTIsMTIuNjJjLS4yOTEuMTc1LS40MDgtLjA4Ny0uMTQ2LS4yNDdaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNDA3Ljk1MSAtNzgzLjk5OSknIGZpbGw9JyUyM2ZmYycgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0MvZyUzRSUzQ2cgdHJhbnNmb3JtPSd0cmFuc2xhdGUoNy43NzMgNC4wOSknJTNFJTNDcGF0aCBkPSdNNjQxLjg2NCwxMTEuMjEzYS4zNi4zNiwwLDAsMCwuMzY0LS4zNjQuMzQ4LjM0OCwwLDAsMC0uMzY0LS4zNDkuMzU3LjM1NywwLDEsMCwwLC43MTNaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNTU1Ljg5NiAtOTguNTA2KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTQ4MC41NjQsODEuNjI4YS4zNjQuMzY0LDAsMSwwLS4zNjQtLjM2NC4zNy4zNywwLDAsMCwuMzY0LjM2NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC00MTguMDc1IC03My4yMTQpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNNDE2LjM2NCwyNzkuMjI4YS4zNjQuMzY0LDAsMSwwLS4zNjQtLjM2NC4zNy4zNywwLDAsMCwuMzY0LjM2NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0zNjMuMjIgLTI0Mi4wNTEpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNNTU0LjA2NCw1MzAuMDI4YS4zNjQuMzY0LDAsMSwwLS4zNjQtLjM2NC4zNy4zNywwLDAsMCwuMzY0LjM2NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC00ODAuODc2IC00NTYuMzQ1KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTQyMS4yNjQsNjUyLjIxM2EuMzU3LjM1NywwLDAsMCwuMzY0LS4zNDkuMzcuMzcsMCwwLDAtLjM2NC0uMzY0LjM1Ny4zNTcsMCwxLDAsMCwuNzEzWicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTM2Ny40MDYgLTU2MC43NTcpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNNDczLjE2NCw2NjIuMDI4YS4zNjQuMzY0LDAsMSwwLS4zNjQtLjM2NC4zNy4zNywwLDAsMCwuMzY0LjM2NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC00MTEuNzUyIC01NjkuMTMxKScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTY4Ny45NjQsODQ3LjEyOGEuMzY0LjM2NCwwLDEsMC0uMzY0LS4zNjQuMzYuMzYsMCwwLDAsLjM2NC4zNjRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNTk1LjI4NSAtNzI3LjI4NyknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J002MjEuMzY0LDg5MS43MTNhLjM2LjM2LDAsMCwwLC4zNjQtLjM2NC4zNDguMzQ4LDAsMCwwLS4zNjQtLjM0OS4zNTcuMzU3LDAsMSwwLDAsLjcxM1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC01MzguMzggLTc2NS4zOTUpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTc5LjI2NCw2ODkuMTI4YS4zNjQuMzY0LDAsMSwwLS4zNjQtLjM2NC4zOC4zOCwwLDAsMCwuMzY0LjM2NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xNjAuNjMyIC01OTIuMjg2KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTc5OS4xNjQsNjQyLjIyOGEuMzY0LjM2NCwwLDEsMC0uMzY0LS4zNjQuMzYuMzYsMCwwLDAsLjM2NC4zNjRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNjkwLjI5OSAtNTUyLjIxMyknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xMDI4Ljc2NCw3NDUuOTI4YS4zNjQuMzY0LDAsMSwwLS4zNjQtLjM2NC4zNy4zNywwLDAsMCwuMzY0LjM2NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC04ODYuNDc4IC02NDAuODE4KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTEyNDMuNjY0LDU0My40MjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM2LjM2LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTEwNzAuMDk3IC00NjcuNzk0KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE0MDEuNjY0LDM0OC4zMjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM3LjM3LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTEyMDUuMDk4IC0zMDEuMDkzKScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTEzNjIuMTY0LDI1NC41MjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM2LjM2LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTExNzEuMzQ4IC0yMjAuOTQ3KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE0NzMuOTQ0LDIwMy42MTNhLjM1Ny4zNTcsMCwxLDAsMC0uNzEzLjM0OC4zNDgsMCwwLDAtLjM0OS4zNjQuMzM2LjMzNiwwLDAsMCwuMzQ5LjM0OVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMjY2Ljg2OSAtMTc3LjQ1NiknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNTUyLjM2NCwxOTcuNzI4YS4zNjQuMzY0LDAsMSwwLS4zNjQtLjM2NC4zNi4zNiwwLDAsMCwuMzY0LjM2NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMzMzLjg2MiAtMTcyLjQxNSknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNDUzLjM2NCwxNTcuNzI4YS4zNjQuMzY0LDAsMSwwLS4zNjQtLjM2NC4zNTIuMzUyLDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTEyNDkuMjczIC0xMzguMjM3KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTEzMDUuMzY0LDM5LjcyOGEuMzY0LjM2NCwwLDEsMC0uMzY0LS4zNjQuMzcuMzcsMCwwLDAsLjM2NC4zNjRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTEyMi44MTYgLTM3LjQxMyknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNjczLjM2NCwzOS43MjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM3LjM3LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTE0MzcuMjQ5IC0zNy40MTMpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTY2My40NjQsMjI5LjgyOGEuMzY0LjM2NCwwLDEsMC0uMzY0LS4zNjQuMzYuMzYsMCwwLDAsLjM2NC4zNjRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTQyOC43OSAtMTk5Ljg0MiknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNTM5Ljk2NCw0NzEuODI4YS4zNjQuMzY0LDAsMSwwLS4zNjQtLjM2NC4zNi4zNiwwLDAsMCwuMzY0LjM2NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMzIzLjI2NyAtNDA2LjYxNiknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNjUxLjA2NCw1NzguMDI4YS4zNjQuMzY0LDAsMSwwLS4zNjQtLjM2NC4zNy4zNywwLDAsMCwuMzY0LjM2NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xNDE4LjE5NSAtNDk3LjM1OCknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNTkxLjg2NCw3NTMuNDEzYS4zNi4zNiwwLDAsMCwuMzY0LS4zNjQuMzQ4LjM0OCwwLDAsMC0uMzY0LS4zNDkuMzU3LjM1NywwLDEsMCwwLC43MTNaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTM2Ny42MTIgLTY0Ny4yMjYpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTI3My4yNjQsNzM4LjUyOGEuMzY0LjM2NCwwLDEsMC0uMzY0LS4zNjQuMzYuMzYsMCwwLDAsLjM2NC4zNjRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTA5NS4zODggLTYzNC40OTUpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTE0Mi4zNjQsODU5LjUyOGEuMzY0LjM2NCwwLDEsMC0uMzY0LS4zNjQuMzguMzgsMCwwLDAsLjM2NC4zNjRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtOTgzLjU0MiAtNzM3Ljg4MiknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xMDI2LjM2NCwxMjMuNjI4YS4zNDguMzQ4LDAsMCwwLC4zNDktLjM2NC4zNTcuMzU3LDAsMSwwLS4zNDkuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTg4NC40MjcgLTEwOS4xMDEpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTMyLjM2NCw1Mi4wMjhhLjM0OC4zNDgsMCwwLDAsLjM0OS0uMzY0LjM1Ny4zNTcsMCwxLDAtLjcxMywwLC4zNy4zNywwLDAsMCwuMzY0LjM2NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMjAuNTU5IC00Ny45MjMpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTQ1LjIsNjIuNDk0YS41OS41OSwwLDAsMCwuNi0uNi42LjYsMCwwLDAtLjYtLjYuNjA5LjYwOSwwLDAsMC0uNi42LjYuNiwwLDAsMCwuNi42WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTEzMS4zMjUgLTU2LjQ2NyknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00yNzkuNiwyOS4yOTRhLjYuNiwwLDAsMCwuNi0uNi42MDkuNjA5LDAsMCwwLS42LS42LjYuNiwwLDAsMC0uNi42LjU5LjU5LDAsMCwwLC42LjZaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMjQ2LjE2MSAtMjguMSknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00zMjksNzYuMTk0YS42MDkuNjA5LDAsMCwwLC42LS42LjYuNiwwLDAsMC0uNi0uNi42LjYsMCwwLDAsMCwxLjE5NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0yODguMzcxIC02OC4xNzMpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNNjQxLjMsNTIuNzk0YS42LjYsMCwwLDAsLjYtLjYuNTkuNTksMCwwLDAtLjYtLjYuNi42LDAsMCwwLDAsMS4xOTRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNTU1LjIxMiAtNDguMTc5KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTI2Ni40LDM3NS4zOTRhLjYuNiwwLDAsMCwuNi0uNi42MDkuNjA5LDAsMCwwLS42LS42LjYuNiwwLDAsMC0uNi42LjU5LjU5LDAsMCwwLC42LjZaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMjM0Ljg4MyAtMzIzLjgyMSknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J001NzIuNiw3MTguNjk0YS42LjYsMCwwLDAsLjYtLjYuNjA5LjYwOSwwLDAsMC0uNi0uNi42LjYsMCwxLDAsMCwxLjE5NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC00OTYuNTEyIC02MTcuMTUpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNNTQsODc2LjY5NGEuNi42LDAsMSwwLDAtMS4xOTQuNjA5LjYwOSwwLDAsMC0uNi42LjYuNiwwLDAsMCwuNi42WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTUzLjQgLTc1Mi4xNTIpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTAwMi4zLDkwOC43OTRhLjU5LjU5LDAsMCwwLC42LS42LjYuNiwwLDAsMC0uNi0uNi42MDkuNjA5LDAsMCwwLS42LjYuNTkuNTksMCwwLDAsLjYuNlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC04NjMuNjY0IC03NzkuNTc5KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTExOTIuOSw0NzQuMTk0YS42LjYsMCwwLDAsLjYtLjYuNTkuNTksMCwwLDAtLjYtLjYuNi42LDAsMSwwLDAsMS4xOTRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTAyNi41MiAtNDA4LjI0KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE1ODguMSw2NzMuNDk0YS41OS41OSwwLDAsMCwuNi0uNi42LjYsMCwwLDAtLjYtLjYuNjA5LjYwOSwwLDAsMC0uNi42LjYuNiwwLDAsMCwuNi42WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTEzNjQuMTk1IC01NzguNTMpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNOTM1LjQsMjIwLjA5NGEuNi42LDAsMCwwLC42LS42LjU5LjU5LDAsMCwwLS42LS42LjYuNiwwLDAsMC0uNi42LjU5LjU5LDAsMCwwLC42LjZaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtODA2LjUwMiAtMTkxLjEyNyknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNTgyLjYsNjMuNDk0YS42MDkuNjA5LDAsMCwwLC42LS42LjYuNiwwLDEsMC0xLjE5NCwwLC42MDkuNjA5LDAsMCwwLC42LjZaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTM1OS40OTUgLTU3LjMyMiknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J002NzkuMjQ3LDQ0Ni45OTVhLjI0Ny4yNDcsMCwxLDAtLjI0Ny0uMjQ3LjI0NS4yNDUsMCwwLDAsLjI0Ny4yNDdaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNTg3LjkzNyAtMzg1LjU5NyknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J002NzcuNTQ3LDE2MC45OTVhLjI1NS4yNTUsMCwwLDAsLjI0Ny0uMjQ3LjI0NS4yNDUsMCwwLDAtLjI0Ny0uMjQ3LjI0Ny4yNDcsMCwxLDAsMCwuNDk1WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTU4Ni40ODQgLTE0MS4yMjgpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNOTY1LjI0Nyw2NS41OTVhLjI1NS4yNTUsMCwwLDAsLjI0Ny0uMjQ3LjI0NS4yNDUsMCwwLDAtLjI0Ny0uMjQ3LjIzNy4yMzcsMCwwLDAtLjI0Ny4yNDcuMjQ1LjI0NSwwLDAsMCwuMjQ3LjI0N1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC04MzIuMzA2IC01OS43MTQpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTMxNS45NDgsMjk3LjY5NWEuMjQ3LjI0NywwLDEsMC0uMjQ3LS4yNDcuMjM3LjIzNywwLDAsMCwuMjQ3LjI0N1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMTMxLjk1OCAtMjU4LjAyOSknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNTY1LjM0OCwyOTcuNjk1YS4yNTUuMjU1LDAsMCwwLC4yNDctLjI0Ny4yNDUuMjQ1LDAsMCwwLS4yNDctLjI0Ny4yNTUuMjU1LDAsMCwwLS4yNDguMjQ3LjIzNy4yMzcsMCwwLDAsLjI0OC4yNDdaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTM0NS4wNTUgLTI1OC4wMjkpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTYyNy4wNDgsNTE3LjQ5NWEuMjQ3LjI0NywwLDAsMCwwLS40OTUuMjQ3LjI0NywwLDEsMCwwLC40OTVaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTM5Ny43NzQgLTQ0NS44MzUpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTA0MS43NDgsNTM3LjI5NWEuMjQ3LjI0NywwLDAsMCwwLS40OTUuMjQ3LjI0NywwLDEsMCwwLC40OTVaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtODk3LjY3MSAtNDYyLjc1MyknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xMTM4LjE0Nyw3MjkuODk1YS4yNDcuMjQ3LDAsMSwwLS4yNDctLjI0Ny4yNDUuMjQ1LDAsMCwwLC4yNDcuMjQ3WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTk4MC4wMzkgLTYyNy4zMTgpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNNDI2Ljk0Nyw0MDYuMzk1YS4yNDcuMjQ3LDAsMSwwLDAtLjQ5NS4yNTUuMjU1LDAsMCwwLS4yNDcuMjQ3LjI0NS4yNDUsMCwwLDAsLjI0Ny4yNDdaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMzcyLjM2MiAtMzUwLjkwNyknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00yNTYuNDQ3LDIxMy4xOTVhLjI0Ny4yNDcsMCwxLDAtLjI0Ny0uMjQ3LjI0NS4yNDUsMCwwLDAsLjI0Ny4yNDdaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMjI2LjY4IC0xODUuODI5KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTI1MS41NDcsMzM3LjI5NWEuMjQ3LjI0NywwLDEsMC0uMjQ3LS4yNDcuMjU1LjI1NSwwLDAsMCwuMjQ3LjI0N1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0yMjIuNDkzIC0yOTEuODY1KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE1Ny43NDcsNTEwLjA5NWEuMjQ3LjI0NywwLDAsMCwwLS40OTUuMjQ1LjI0NSwwLDAsMC0uMjQ3LjI0Ny4yMzcuMjM3LDAsMCwwLC4yNDcuMjQ3WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTE0Mi4zNDcgLTQzOS41MTIpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMjE0LjM0NywxNzUuMTk1YS4yNDUuMjQ1LDAsMCwwLC4yNDctLjI0Ny4yNDcuMjQ3LDAsMCwwLS40OTUsMCwuMjQ1LjI0NSwwLDAsMCwuMjQ3LjI0N1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xOTAuNzA4IC0xNTMuMzYxKScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTM3MC4xNCwzMjIuNDk1YS4yNTUuMjU1LDAsMCwwLC4yNDctLjI0Ny4yNDUuMjQ1LDAsMCwwLS4yNDctLjI0Ny4yNTUuMjU1LDAsMCwwLS4yNDcuMjQ3LjIzNy4yMzcsMCwwLDAsLjI0Ny4yNDdaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMzIzLjgyMyAtMjc5LjIyKScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE5Mi42NDcsODcyLjY5NWEuMjQ3LjI0NywwLDEsMC0uMjQ3LS4yNDcuMjQ1LjI0NSwwLDAsMCwuMjQ3LjI0N1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xNzIuMTY3IC03NDkuMzMyKScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTU0Mi45NDgsOTM3LjI5NWEuMjU1LjI1NSwwLDAsMCwuMjQ3LS4yNDcuMjQ1LjI0NSwwLDAsMC0uMjQ3LS4yNDcuMjU1LjI1NSwwLDAsMC0uMjQ3LjI0Ny4yNDUuMjQ1LDAsMCwwLC4yNDcuMjQ3WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTQ3MS40NzcgLTgwNC41MjkpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTY5MS4yNDgsODgxLjk5NWEuMjQ3LjI0NywwLDEsMC0uMjQ4LS4yNDcuMjU1LjI1NSwwLDAsMCwuMjQ4LjI0N1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xNDUyLjYyOSAtNzU3LjI3OCknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xMzMxLjQ0OCw2NDQuMTk1YS4yNDcuMjQ3LDAsMCwwLDAtLjQ5NS4yNDcuMjQ3LDAsMCwwLDAsLjQ5NVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMTQ1LjIwMiAtNTU0LjA5MyknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0MvZyUzRSUzQy9zdmclM0VcIik7XG5cdGN1cnNvcjogdXJsKCdkYXRhOmltYWdlL3N2Zyt4bWw7dXRmOCw8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB3aWR0aD1cIjQwXCIgaGVpZ2h0PVwiNDBcIiB2aWV3Qm94PVwiMCAwIDQwIDQwXCI+PGcgdHJhbnNmb3JtPVwidHJhbnNsYXRlKC04NDQgLTUwMClcIj48ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoODQ0IC01MjAuMzYpXCI+PHBhdGggZD1cIk0xOTQuNzg3LDEyMTIuMjlhMi44NTgsMi44NTgsMCwxLDAsMi44NTgsMi44NTgsMi44NjksMi44NjksMCwwLDAtMi44NTgtMi44NThaXCIgdHJhbnNmb3JtPVwidHJhbnNsYXRlKC0xNzQuNzkyIC0xNzQuNzkzKVwiIGZpbGw9XCIlMjM4Njg2ODZcIi8+PHBhdGggZD1cIk0yMDkuNDE2LDEyMjguMzVhMS40MjksMS40MjksMCwxLDEtMS40MjQsMS40MjQsMS40MTksMS40MTksMCwwLDEsMS40MjQtMS40MjRaXCIgdHJhbnNmb3JtPVwidHJhbnNsYXRlKC0xODkuNDIxIC0xODkuNDE5KVwiIGZpbGw9XCIlMjNmZjY1NWJcIi8+PGcgdHJhbnNmb3JtPVwidHJhbnNsYXRlKDAgMTAyMC4zNilcIj48cGF0aCBkPVwiTTIxNi4wMjQsMTAyMC4zNnYxMi44NTVoMS40MjRWMTAyMC4zNlpcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTE5Ni43MzYgLTEwMjAuMzYpXCIgZmlsbD1cIiUyMzg2ODY4NlwiLz48cGF0aCBkPVwiTTIxNi4wMjQsMTMyNC4yNnYxMi44NjZoMS40MjRWMTMyNC4yNlpcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTE5Ni43MzYgLTEyOTcuMTI2KVwiIGZpbGw9XCIlMjM4Njg2ODZcIi8+PHBhdGggZD1cIk0zMDQuMDE2LDEyMzYuMjd2MS40MzRoMTIuODU1di0xLjQzNFpcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTI3Ni44NzEgLTEyMTYuOTkyKVwiIGZpbGw9XCIlMjM4Njg2ODZcIi8+PHBhdGggZD1cIk0wLDEyMzYuMjd2MS40MzRIMTIuODU1di0xLjQzNFpcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoMCAtMTIxNi45OTIpXCIgZmlsbD1cIiUyMzg2ODY4NlwiLz48L2c+PGcgdHJhbnNmb3JtPVwidHJhbnNsYXRlKDguODYxIDEwMjkuMjE2KVwiPjxwYXRoIGQ9XCJNMjQ0LjUsMTExOS41NDhhLjcxNC43MTQsMCwwLDAtLjEyLDEuNDA5LDEwLDEwLDAsMCwxLDcuNCw3LjM5MS43MTUuNzE1LDAsMCwwLDEuMzkxLS4zM3YwYTExLjQzMSwxMS40MzEsMCwwLDAtOC40NTQtOC40NDMuNzE4LjcxOCwwLDAsMC0uMjEyLS4wMjNaXCIgdHJhbnNmb3JtPVwidHJhbnNsYXRlKC0yMzAuOTE4IC0xMTE5LjU0NylcIiBmaWxsPVwiJTIzODY4Njg2XCIvPjxwYXRoIGQ9XCJNMTA3Ljk3MSwxMTE5LjU4OWEuNzIxLjcyMSwwLDAsMC0uMTkuMDIzLDExLjQyOCwxMS40MjgsMCwwLDAtOC40NCw4LjQyNy43MTQuNzE0LDAsMCwwLDEuMzc5LjM2OWMwLS4wMS4wMDUtLjAyMS4wMDgtLjAzMWExMCwxMCwwLDAsMSw3LjM4Ni03LjM3Ny43MTQuNzE0LDAsMCwwLS4xNDItMS40MDlaXCIgdHJhbnNmb3JtPVwidHJhbnNsYXRlKC05OS4zMSAtMTExOS41ODYpXCIgZmlsbD1cIiUyMzg2ODY4NlwiLz48cGF0aCBkPVwiTTI1Mi40MDcsMTI2NC4zMzhhLjcxNC43MTQsMCwwLDAtLjcxMi41NTUsMTAsMTAsMCwwLDEtNy4zODYsNy4zOC43MTQuNzE0LDAsMCwwLC4yODIsMS40bC4wNTMtLjAxM2ExMS40MywxMS40MywwLDAsMCw4LjQ0LTguNDI5LjcxMy43MTMsMCwwLDAtLjY3OC0uODkzWlwiIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgtMjMwLjgzNSAtMTI1MS40MSlcIiBmaWxsPVwiJTIzODY4Njg2XCIvPjxwYXRoIGQ9XCJNOTkuOTI0LDEyNjQuMDc3YS43MTQuNzE0LDAsMCwwLS42NTYuODksMTEuNDMxLDExLjQzMSwwLDAsMCw4LjQ0LDguNDU0LjcxNS43MTUsMCwwLDAsLjMzNS0xLjM5aDBhOS45OTUsOS45OTUsMCwwLDEtNy4zODYtNy40LjcxNC43MTQsMCwwLDAtLjczNC0uNTU4aDBaXCIgdHJhbnNmb3JtPVwidHJhbnNsYXRlKC05OS4yNDYgLTEyNTEuMTcyKVwiIGZpbGw9XCIlMjM4Njg2ODZcIi8+PC9nPjxnIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgyIDEwMjIuMzYpXCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCIlMjM3MDcwNzBcIiBzdHJva2Utd2lkdGg9XCIyXCI+PGNpcmNsZSBjeD1cIjE4XCIgY3k9XCIxOFwiIHI9XCIxOFwiIHN0cm9rZT1cIm5vbmVcIi8+PGNpcmNsZSBjeD1cIjE4XCIgY3k9XCIxOFwiIHI9XCIxN1wiIGZpbGw9XCJub25lXCIvPjwvZz48L2c+PC9nPjwvc3ZnPicpIDE2IDE2LCBhdXRvO1xufVxuXG46Z2xvYmFsKC5hc3Rlcm9pZCkge1xuXHR3aWR0aDo0MHB4O1xuXHRoZWlnaHQ6NDBweDtcblx0YmFja2dyb3VuZC1pbWFnZTogdXJsKFwiZGF0YTppbWFnZS9zdmcreG1sLCUzQ3N2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc2MCcgaGVpZ2h0PSc2MCcgdmlld0JveD0nMCAwIDYwIDYwJyUzRSUzQ2cgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMCAwKSclM0UlM0NwYXRoIGQ9J00yMzAuOTk0LDExLjc0MiwyMjEuODY3LDIyLjR2MkExNC42NzEsMTQuNjcxLDAsMCwwLDIzNi4zLDEyLjM2NiwyNS43NDEsMjUuNzQxLDAsMCwwLDIzMC45OTQsMTEuNzQyWicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTE5NS44NjcgLTEwLjM2NiknIGZpbGw9JyUyMzRhOGRjNicvJTNFJTNDcGF0aCBkPSdNMTQ2LjE3OSwxMS45ODRsLjAzNS0uMjY4YTMxLjk3NiwzMS45NzYsMCwwLDAtMjAuMzgxLDcuNCwxNC42MzUsMTQuNjM1LDAsMCwwLDExLjI1NCw1LjI2MnYtMkMxNDEuNTYsMjIuMzc1LDE0NS4zODMsMTgsMTQ2LjE3OSwxMS45ODRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTExLjA4OCAtMTAuMzQpJyBmaWxsPSclMjM3N2FhZDQnLyUzRSUzQ3BhdGggZD0nTTI0MS4wNTksMjQuMjIxQTEwLjY2MywxMC42NjMsMCwwLDAsMjMzLjksNy40NDFhMjIuMTY3LDIyLjE2NywwLDAsMC04LjQ3Mi00LjkxM2MuMDExLS4wNTcuMDIyLS4xMTQuMDMzLS4xNzFhMiwyLDAsMCwwLTMuOTM2LS43MTMsMTIuNjIxLDEyLjYyMSwwLDAsMS0xLjM1MywzLjgybC0xMi44MSw1MS44ODZhMTAuNjYzLDEwLjY2MywwLDAsMCwxNy4xNzgtNC43MTksMzUuMTg4LDM1LjE4OCwwLDAsMCw0LjU3Ni0zLjMzOSw0LjY2Niw0LjY2NiwwLDAsMCw1LjItNS41MDZBMzEuOCwzMS44LDAsMCwwLDI0MS4wNTksMjQuMjIxWicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTE4My4wNjQgMCknIGZpbGw9JyUyM2E1YzZlMycvJTNFJTNDcGF0aCBkPSdNNTMuOTE0LDY3LjhjLjUyOC02LjI1OS0xLjM3Mi0xMS45LTUuMzUxLTE1Ljg3NUExOC45MTcsMTguOTE3LDAsMCwwLDM3LjExLDQ2LjYxOWExMi42NzIsMTIuNjcyLDAsMCwxLTIwLjgzLDIuMDI2LDIsMiwwLDEsMC0zLjA2OCwyLjU2N2wuMDE2LjAxOXEtLjY1Ny42LTEuMjkzLDEuMjI5YTM1Ljc0NCwzNS43NDQsMCwwLDAtNC4xNzcsNS4wMTdBMTIuNjcyLDEyLjY3MiwwLDAsMCwyLjAxMyw3Ni4wMDksMjMuMSwyMy4xLDAsMCwwLDguNjA4LDkxLjkxNiwyMy4wNjQsMjMuMDY0LDAsMCwwLDI0LjMsOTguNTA1YTUxLjczOCw1MS43MzgsMCwwLDAsMjAuOTM2LTEyLjc4QTI5LjA3MiwyOS4wNzIsMCwwLDAsNTMuOTE0LDY3LjhaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgwIC00MS4xNTYpJyBmaWxsPSclMjNkMmUzZjEnLyUzRSUzQ3BhdGggZD0nTTI2Ny4zNzgsMzY0LjA4OXYxMy4zMzNhNi42NjcsNi42NjcsMCwwLDAsMC0xMy4zMzNaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMjM2LjA0NSAtMzIxLjQyMyknIGZpbGw9JyUyMzRhOGRjNicvJTNFJTNDcGF0aCBkPSdNMjE5LjgyMSwzNzAuNzU2YzAtMy42ODItMS4xOTQtNi42NjctMi42NjctNi42NjdhNi42NjcsNi42NjcsMCwwLDAsMCwxMy4zMzNDMjE4LjYyOCwzNzcuNDIyLDIxOS44MjEsMzc0LjQzOCwyMTkuODIxLDM3MC43NTZaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTg1LjgyMSAtMzIxLjQyMyknIGZpbGw9JyUyMzc3YWFkNCcvJTNFJTNDcGF0aCBkPSdNNDIwLjk3OCw5Ni43MTF2MTMuMzMzYTYuNjY3LDYuNjY3LDAsMCwwLDAtMTMuMzMzWicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTM3MS42NDUgLTg1LjM3OCknIGZpbGw9JyUyMzRhOGRjNicvJTNFJTNDcGF0aCBkPSdNMzczLjQyMSwxMDMuMzc4YzAtMy42ODItMS4xOTQtNi42NjctMi42NjctNi42NjdhNi42NjcsNi42NjcsMCwxLDAsMCwxMy4zMzNDMzcyLjIyOCwxMTAuMDQ0LDM3My40MjEsMTA3LjA2LDM3My40MjEsMTAzLjM3OFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0zMjEuNDIxIC04NS4zNzgpJyBmaWxsPSclMjM3N2FhZDQnLyUzRSUzQ2cgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTUuNjY3IDI1KSclM0UlM0NjaXJjbGUgY3g9JzEnIGN5PScxJyByPScxJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMy4zMzMgNCknIGZpbGw9JyUyM2E1YzZlMycvJTNFJTNDY2lyY2xlIGN4PScxJyBjeT0nMScgcj0nMScgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTcuMzMzKScgZmlsbD0nJTIzYTVjNmUzJy8lM0UlM0NjaXJjbGUgY3g9JzEnIGN5PScxJyByPScxJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgyOCAxMi42NjcpJyBmaWxsPSclMjNhNWM2ZTMnLyUzRSUzQ2NpcmNsZSBjeD0nMScgY3k9JzEnIHI9JzEnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDAgMjQuNjY3KScgZmlsbD0nJTIzYTVjNmUzJy8lM0UlM0MvZyUzRSUzQ3BhdGggZD0nTTEwOC4wODksMTY0Ljk3OHYxNy4zMzNhOC42NjcsOC42NjcsMCwxLDAsMC0xNy4zMzNaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtOTUuNDIyIC0xNDUuNjQ1KScgZmlsbD0nJTIzNGE4ZGM2Jy8lM0UlM0NwYXRoIGQ9J000Ny40NjYsMTczLjY0NGMwLTQuNzg2LTIuMDg5LTguNjY3LTQuNjY3LTguNjY3YTguNjY3LDguNjY3LDAsMSwwLDAsMTcuMzMzQzQ1LjM3NywxODIuMzEsNDcuNDY2LDE3OC40Myw0Ny40NjYsMTczLjY0NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0zMC4xMzMgLTE0NS42NDQpJyBmaWxsPSclMjM3N2FhZDQnLyUzRSUzQy9nJTNFJTNDL3N2ZyUzRVwiKTtcblx0YmFja2dyb3VuZC1zaXplOmNvbnRhaW47XG5cdGJhY2tncm91bmQtcmVwZWF0Om5vLXJlcGVhdDtcbn1cbjpnbG9iYWwoLnNwYWNlc2hpcCkge1xuXHR3aWR0aDozNnB4O1xuXHRoZWlnaHQ6NDZweDtcblx0YmFja2dyb3VuZC1pbWFnZTogdXJsKFwiZGF0YTppbWFnZS9zdmcreG1sLCUzQ3N2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyNi4zNDInIGhlaWdodD0nMzYnIHZpZXdCb3g9JzAgMCAyNi4zNDIgMzYnJTNFJTNDZyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTIzLjU4MyAwKSclM0UlM0NwYXRoIGQ9J00xMzYuNzU1LDE1MC4wNjNsLTEyLjUxMiwxMC4wMWExLjc1NiwxLjc1NiwwLDAsMC0uNjU5LDEuMzcxdjQuNDI0bDEzLjE3MS0yLjYzNCwxMy4xNzEsMi42MzR2LTQuNDI0YTEuNzU2LDEuNzU2LDAsMCwwLS42NTktMS4zNzFaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMC4wMDEgLTEzNS4xMzcpJyBmaWxsPSclMjNmZjY0NjQnLyUzRSUzQ3BhdGggZD0nTTIyMC42MTYsMzEzLjEzOGwtMS4wNDQtNC4xNzdoLTYuNjRsLTEuMDQ0LDQuMTc3YS44NzguODc4LDAsMCwwLC44NTIsMS4wOTFoNy4wMjVhLjg3OC44NzgsMCwwLDAsLjg1Mi0xLjA5MVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC03OS40OTggLTI3OC4yMyknIGZpbGw9JyUyMzk1OWNiMycvJTNFJTNDcGF0aCBkPSdNMjE0LjUyMywzMTMuMTM4bDEuMDQ0LTQuMTc3aC0yLjYzNGwtMS4wNDQsNC4xNzdhLjg3OC44NzgsMCwwLDAsLjg1MiwxLjA5MWgyLjYzNGEuODc4Ljg3OCwwLDAsMS0uODUyLTEuMDkxWicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTc5LjQ5OCAtMjc4LjIzKScgZmlsbD0nJTIzNzA3NDg3Jy8lM0UlM0NwYXRoIGQ9J00yMDcuNTY5LjQyOSwyMDMuNDgsNy43MzZhMy41MTMsMy41MTMsMCwwLDAtLjQ0NywxLjcxNVYzMC43MzJhMS43NTYsMS43NTYsMCwwLDAsMS43NTYsMS43NTZoNy4wMjVhMS43NTYsMS43NTYsMCwwLDAsMS43NTYtMS43NTZWOS40NWEzLjUxMSwzLjUxMSwwLDAsMC0uNDQ3LTEuNzE1TDIwOS4wMzQuNDI5QS44MzkuODM5LDAsMCwwLDIwNy41NjkuNDI5WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTcxLjU0NyAwKScgZmlsbD0nJTIzZTRlYWY2Jy8lM0UlM0NwYXRoIGQ9J00yMDYuNTQ1LDMwLjc4MVY5LjVhNy42NTgsNy42NTgsMCwwLDEsLjE4Ni0xLjcxNWwxLjctNy4zMDdhMS4xMTEsMS4xMTEsMCwwLDEsLjE1Ny0uMzcxLjgzMy44MzMsMCwwLDAtMS4wMjMuMzcxTDIwMy40OCw3Ljc4NWEzLjUxMywzLjUxMywwLDAsMC0uNDQ3LDEuNzE1VjMwLjc4MWExLjc1NiwxLjc1NiwwLDAsMCwxLjc1NiwxLjc1NmgyLjQ4OEMyMDYuODczLDMyLjUzNywyMDYuNTQ1LDMxLjc1MSwyMDYuNTQ1LDMwLjc4MVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC03MS41NDcgLTAuMDQ5KScgZmlsbD0nJTIzYzdjZmUyJy8lM0UlM0NwYXRoIGQ9J00yMDkuMDM1LjQzYS44MzkuODM5LDAsMCwwLTEuNDY0LDBsLTQuMDg5LDcuMzA3YTMuNTEzLDMuNTEzLDAsMCwwLS40NDcsMS43MTV2NC42aDEwLjUzN3YtNC42YTMuNTExLDMuNTExLDAsMCwwLS40NDctMS43MTVaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNzEuNTQ4IC0wLjAwMSknIGZpbGw9JyUyM2ZmNjQ2NCcvJTNFJTNDcGF0aCBkPSdNMjA2LjU0Niw5LjUxMmE3LjY1OCw3LjY1OCwwLDAsMSwuMTg2LTEuNzE1bDEuNy03LjMwN2ExLjExMSwxLjExMSwwLDAsMSwuMTU3LS4zNzEuODYuODYsMCwwLDAtLjU1My0uMDEyYy0uMDEzLDAtLjAyNi4wMTEtLjAzOS4wMTZhLjgxMi44MTIsMCwwLDAtLjE5My4xMDZjLS4wMTkuMDE0LS4wMzguMDI3LS4wNTYuMDQzYS44MjEuODIxLDAsMCwwLS4xODIuMjE4TDIwMy40ODEsNy44YTMuNTEzLDMuNTEzLDAsMCwwLS40NDcsMS43MTV2NC42aDMuNTEyWicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTcxLjU0OCAtMC4wNjEpJyBmaWxsPSclMjNkMjU1NWEnLyUzRSUzQ3BhdGggZD0nTTIxMy41NzEsMTQxLjIzNUgyMDMuMDM0djEuNzU2aDIuMjUyYTMuNDY5LDMuNDY5LDAsMCwwLDYuMDM0LDBoMi4yNTJ2LTEuNzU2WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTcxLjU0OCAtMTI3LjE4NyknIGZpbGw9JyUyM2M3Y2ZlMicvJTNFJTNDY2lyY2xlIGN4PScxLjc1NicgY3k9JzEuNzU2JyByPScxLjc1NicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTM0Ljk5OSAxMi4yOTIpJyBmaWxsPSclMjM1YjVkNmUnLyUzRSUzQ3BhdGggZD0nTTIwNi41NDYsMTQ0LjI2NnYtMy4wMzJoLTMuNTEydjEuNzU2aDIuMjUyQTMuNTUxLDMuNTUxLDAsMCwwLDIwNi41NDYsMTQ0LjI2NlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC03MS41NDggLTEyNy4xODYpJyBmaWxsPSclMjNhZmI5ZDInLyUzRSUzQ3BhdGggZD0nTTIxOS42NzcuNDI5bC0zLjIsNS43MTZoNy44NjNsLTMuMi01LjcxNkEuODM5LjgzOSwwLDAsMCwyMTkuNjc3LjQyOVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC04My42NTUgMCknIGZpbGw9JyUyMzcwNzQ4NycvJTNFJTNDcGF0aCBkPSdNMjE5LjIxMSw2LjIwNiwyMjAuNTQ0LjQ4OUExLjExMSwxLjExMSwwLDAsMSwyMjAuNy4xMThhLjg2Ljg2LDAsMCwwLS41NTMtLjAxMmwtLjAxMSwwLS4wMjguMDExYS44MTIuODEyLDAsMCwwLS4xOTMuMTA2bC0uMDIuMDE1Yy0uMDEyLjAwOS0uMDI1LjAxOC0uMDM3LjAyOGEuODIzLjgyMywwLDAsMC0uMTgyLjIxOGwtMy4yLDUuNzE2aDIuNzMyWicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTgzLjY1NiAtMC4wNiknIGZpbGw9JyUyMzViNWQ2ZScvJTNFJTNDZyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMjMuNTgzIDI1LjQ2MyknJTNFJTNDcGF0aCBkPSdNMTIzLjU4NCwyNjEuMjY0bDcuOS0xLjU4MVYyNTZsLTcuOSwyLjEwN1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMjMuNTg0IC0yNTUuOTk2KScgZmlsbD0nJTIzZDI1NTVhJy8lM0UlM0NwYXRoIGQ9J00zMTYuODcsMjYxLjI2NGwtNy45LTEuNTgxVjI1Nmw3LjksMi4xMDdaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMjkwLjUyNyAtMjU1Ljk5NiknIGZpbGw9JyUyM2QyNTU1YScvJTNFJTNDL2clM0UlM0NnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEyMy41ODMgMjUuNDYzKSclM0UlM0NwYXRoIGQ9J00xMjQuNDYyLDI2NC44MjRoMGEuODc4Ljg3OCwwLDAsMC0uODc4Ljg3OHY3LjAyNWEuODc4Ljg3OCwwLDAsMCwuODc4Ljg3OGgwYS44NzguODc4LDAsMCwwLC44NzgtLjg3OFYyNjUuN0EuODc4Ljg3OCwwLDAsMCwxMjQuNDYyLDI2NC44MjRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTIzLjU4NCAtMjYzLjk0NiknIGZpbGw9JyUyM2FmYjlkMicvJTNFJTNDcGF0aCBkPSdNMTU5Ljc3MywyNTZoMGEuODc4Ljg3OCwwLDAsMC0uODc4Ljg3OHY0LjM5YS44NzguODc4LDAsMCwwLC44NzguODc4aDBhLjg3OC44NzgsMCwwLDAsLjg3OC0uODc4di00LjM5QS44NzguODc4LDAsMCwwLDE1OS43NzMsMjU2WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTE1NS4zODMgLTI1NS45OTYpJyBmaWxsPSclMjNhZmI5ZDInLyUzRSUzQ3BhdGggZD0nTTM3MS42MzksMjY0LjgyNGgwYS44NzguODc4LDAsMCwxLC44NzguODc4djcuMDI1YS44NzguODc4LDAsMCwxLS44NzguODc4aDBhLjg3OC44NzgsMCwwLDEtLjg3OC0uODc4VjI2NS43QS44NzguODc4LDAsMCwxLDM3MS42MzksMjY0LjgyNFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0zNDYuMTc1IC0yNjMuOTQ2KScgZmlsbD0nJTIzYWZiOWQyJy8lM0UlM0NwYXRoIGQ9J00zMzYuMzI4LDI1NmgwYS44NzguODc4LDAsMCwxLC44NzguODc4djQuMzlhLjg3OC44NzgsMCwwLDEtLjg3OC44NzhoMGEuODc4Ljg3OCwwLDAsMS0uODc4LS44Nzh2LTQuMzlBLjg3OC44NzgsMCwwLDEsMzM2LjMyOCwyNTZaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMzE0LjM3NiAtMjU1Ljk5NiknIGZpbGw9JyUyM2FmYjlkMicvJTNFJTNDL2clM0UlM0NnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEyMy41ODMgMjUuNDQ2KSclM0UlM0NjaXJjbGUgY3g9JzAuODk1JyBjeT0nMC44OTUnIHI9JzAuODk1JyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgwIDAuODYyKScgZmlsbD0nJTIzOTU5Y2IzJy8lM0UlM0NjaXJjbGUgY3g9JzAuODk1JyBjeT0nMC44OTUnIHI9JzAuODk1JyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgzLjQ5NiknIGZpbGw9JyUyMzk1OWNiMycvJTNFJTNDY2lyY2xlIGN4PScwLjg5NScgY3k9JzAuODk1JyByPScwLjg5NScgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMjQuNTUyIDAuODYyKScgZmlsbD0nJTIzOTU5Y2IzJy8lM0UlM0NjaXJjbGUgY3g9JzAuODk1JyBjeT0nMC44OTUnIHI9JzAuODk1JyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgyMS4wNTcpJyBmaWxsPSclMjM5NTljYjMnLyUzRSUzQy9nJTNFJTNDZyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMzUuODc2IDIzLjcwNyknJTNFJTNDcGF0aCBkPSdNMjQ4LjA1LDI0My42MDhoMGEuODc4Ljg3OCwwLDAsMCwuODc4LS44Nzh2LTMuNTEyYS44NzguODc4LDAsMCwwLS44NzgtLjg3OGgwYS44NzguODc4LDAsMCwwLS44NzguODc4djMuNTEyQS44NzguODc4LDAsMCwwLDI0OC4wNSwyNDMuNjA4WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTI0Ny4xNzIgLTIzOC4zNCknIGZpbGw9JyUyM2M3Y2ZlMicvJTNFJTNDcGF0aCBkPSdNMjc0LjUzNCwyNDMuNjA4aDBhLjg3OC44NzgsMCwwLDAsLjg3OC0uODc4di0zLjUxMmEuODc4Ljg3OCwwLDAsMC0uODc4LS44NzhoMGEuODc4Ljg3OCwwLDAsMC0uODc4Ljg3OHYzLjUxMkEuODc4Ljg3OCwwLDAsMCwyNzQuNTM0LDI0My42MDhaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMjcxLjAyMiAtMjM4LjM0KScgZmlsbD0nJTIzYzdjZmUyJy8lM0UlM0MvZyUzRSUzQ3BhdGggZD0nTTIyMS41NjcsMjQzLjYwOGgwYS44NzguODc4LDAsMCwwLC44NzgtLjg3OHYtMy41MTJhLjg3OC44NzgsMCwwLDAtLjg3OC0uODc4aDBhLjg3OC44NzgsMCwwLDAtLjg3OC44Nzh2My41MTJBLjg3OC44NzgsMCwwLDAsMjIxLjU2NywyNDMuNjA4WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTg3LjQ0NyAtMjE0LjYzMyknIGZpbGw9JyUyM2FmYjlkMicvJTNFJTNDL2clM0UlM0Mvc3ZnJTNFXCIpO1xuXHRiYWNrZ3JvdW5kLXNpemU6Y29udGFpbjtcblx0YmFja2dyb3VuZC1yZXBlYXQ6bm8tcmVwZWF0O1xufVxuXG46Z2xvYmFsKC5hc3Rlcm9pZC5hY3RpdmUpIHtcblx0d2lkdGg6NjBweDtcblx0aGVpZ2h0OjYwcHg7XG5cdGJhY2tncm91bmQtaW1hZ2U6IHVybChcImRhdGE6aW1hZ2Uvc3ZnK3htbCwlM0NzdmcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJyB3aWR0aD0nNjUnIGhlaWdodD0nNjQnIHZpZXdCb3g9JzAgMCA2NSA2NCclM0UlM0NnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMDAzIC00OTApJyUzRSUzQ2NpcmNsZSBjeD0nMjMuNScgY3k9JzIzLjUnIHI9JzIzLjUnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEwMDkgNTAyKScgZmlsbD0nJTIzZDJlM2YxJy8lM0UlM0NjaXJjbGUgY3g9JzknIGN5PSc5JyByPSc5JyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMDA5IDUwMiknIGZpbGw9JyUyM2QyZTNmMScvJTNFJTNDY2lyY2xlIGN4PScxMicgY3k9JzEyJyByPScxMicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTAyMSA0OTApJyBmaWxsPSclMjNkMmUzZjEnLyUzRSUzQ2NpcmNsZSBjeD0nMTInIGN5PScxMicgcj0nMTInIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEwMzMgNDk5KScgZmlsbD0nJTIzZDJlM2YxJy8lM0UlM0NjaXJjbGUgY3g9JzEyJyBjeT0nMTInIHI9JzEyJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMDAzIDUyMCknIGZpbGw9JyUyM2QyZTNmMScvJTNFJTNDY2lyY2xlIGN4PScxMicgY3k9JzEyJyByPScxMicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTAzMyA1MzApJyBmaWxsPSclMjNkMmUzZjEnLyUzRSUzQ2NpcmNsZSBjeD0nNy41JyBjeT0nNy41JyByPSc3LjUnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEwNDggNTIzKScgZmlsbD0nJTIzZDJlM2YxJy8lM0UlM0NjaXJjbGUgY3g9JzcuNScgY3k9JzcuNScgcj0nNy41JyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMDEwIDUyMyknIGZpbGw9JyUyMzRhOGRjNicvJTNFJTNDY2lyY2xlIGN4PSc3LjUnIGN5PSc3LjUnIHI9JzcuNScgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTAxNSA1MTQpJyBmaWxsPSclMjM0YThkYzYnLyUzRSUzQ2NpcmNsZSBjeD0nMTgnIGN5PScxOCcgcj0nMTgnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEwMTggNTA0KScgZmlsbD0nJTIzNGE4ZGM2Jy8lM0UlM0NjaXJjbGUgY3g9JzcuNScgY3k9JzcuNScgcj0nNy41JyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMDEwIDUyMyknIGZpbGw9JyUyMzRhOGRjNicvJTNFJTNDY2lyY2xlIGN4PSc0LjUnIGN5PSc0LjUnIHI9JzQuNScgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTA1OSA1MTMpJyBmaWxsPSclMjNkMmUzZjEnLyUzRSUzQ2NpcmNsZSBjeD0nNy41JyBjeT0nNy41JyByPSc3LjUnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEwMzYgNTMzKScgZmlsbD0nJTIzNGE4ZGM2Jy8lM0UlM0NjaXJjbGUgY3g9JzcuNScgY3k9JzcuNScgcj0nNy41JyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMDI3IDQ5OSknIGZpbGw9JyUyMzRhOGRjNicvJTNFJTNDY2lyY2xlIGN4PSc3LjUnIGN5PSc3LjUnIHI9JzcuNScgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTAyMCA1MTgpJyBmaWxsPSclMjM3N2FhZDQnLyUzRSUzQ2NpcmNsZSBjeD0nNy41JyBjeT0nNy41JyByPSc3LjUnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEwMzMgNTA3KScgZmlsbD0nJTIzNzdhYWQ0Jy8lM0UlM0NjaXJjbGUgY3g9JzUuNScgY3k9JzUuNScgcj0nNS41JyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMDM3IDUyNyknIGZpbGw9JyUyMzc3YWFkNCcvJTNFJTNDY2lyY2xlIGN4PSc0JyBjeT0nNCcgcj0nNCcgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTAzNyA1MjcpJyBmaWxsPSclMjNmZmYnLyUzRSUzQ2NpcmNsZSBjeD0nNCcgY3k9JzQnIHI9JzQnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEwMjYgNTIwKScgZmlsbD0nJTIzZmZmJy8lM0UlM0NjaXJjbGUgY3g9JzQnIGN5PSc0JyByPSc0JyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMDQwIDUxMSknIGZpbGw9JyUyM2ZmZicvJTNFJTNDL2clM0UlM0Mvc3ZnJTNFXCIpO1xuXHRiYWNrZ3JvdW5kLXNpemU6Y29udGFpbjtcblx0YmFja2dyb3VuZC1yZXBlYXQ6bm8tcmVwZWF0O1xufVxuLyojIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYkluTnlZeTlqYjIxd2IyNWxiblJ6TDNOeVl5OWpiMjF3YjI1bGJuUnpMMHBUUlVOaGNIUmphR0V1YzNabGJIUmxJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdRVUZEUVRzN1JVRkZSVHRCUVVOR08wTkJRME1zWjBKQlFXZENPME5CUTJoQ0xGbEJRVms3UVVGRFlqczdRVUZGUVR0RFFVTkRMQ3REUVVFclF6dEJRVU5vUkRzN1FVRkZRU3hMUVVGTE96czdRVUZIVERzN1JVRkZSVHRCUVVOR08wTkJRME1zYTBKQlFXdENPME5CUTJ4Q0xGbEJRVms3UTBGRFdpeFhRVUZYTzBOQlExZ3NaVUZCWlR0QlFVTm9RanM3UVVGRlFUdERRVU5ETEZsQlFWazdRMEZEV2l4bFFVRmxPME5CUTJZc1pVRkJaVHREUVVObUxIbENRVUY1UWp0RFFVTjZRaXhaUVVGWk8wTkJRMW9zVjBGQlZ6dEJRVU5hT3p0QlFVVkJPME5CUTBNc1YwRkJWenRKUVVOU0xGbEJRVms3UTBGRFppdzRRa0ZCT0VJN1FVRkRMMEk3TzBGQlJVRTdRMEZEUXl4WFFVRlhPMEZCUTFvN08wRkJSVUU3UTBGRFF5d3JRMEZCSzBNN1FVRkRhRVE3UVVGRFFUdERRVU5ETEdOQlFXTTdRVUZEWmp0QlFVTkJMRXRCUVVzN08wRkJSVXc3TzBWQlJVVTdRVUZEUmp0RFFVTkRMR3RDUVVGclFqdERRVU5zUWl4WlFVRlpPME5CUTFvc1YwRkJWenREUVVOWUxHVkJRV1U3UVVGRGFFSTdPMEZCUlVFN1EwRkRReXhaUVVGWk8wTkJRMW9zWlVGQlpUdERRVU5tTEdWQlFXVTdRMEZEWml4NVFrRkJlVUk3UTBGRGVrSXNWMEZCVnp0QlFVTmFPenRCUVVWQk8wTkJRME1zVjBGQlZ6dERRVU5ZTERoQ1FVRTRRanREUVVNNVFpeFhRVUZYTzBGQlExbzdPMEZCUlVFN1EwRkRReXhYUVVGWE8wRkJRMW83TzBGQlJVRTdRMEZEUXl3clEwRkJLME03UVVGRGFFUTdRVUZEUVR0RFFVTkRMR05CUVdNN1FVRkRaanRCUVVOQkxFdEJRVXM3TzBGQlJVdzdPMFZCUlVVN1FVRkRSaXg1UWtGQlowSTdPMEZCUldoQ08wTkJRME1zWTBGQll6dEJRVU5tTzBGQlEwRTdRMEZEUXp0QlFVTkVPMEZCUTBFc1MwRkJTenM3TzBGQlIwdzdPMFZCUlVVN1FVRkRSanREUVVORExGbEJRVms3UVVGRFlqdEJRVU5CTzBOQlEwTXNXVUZCV1R0RFFVTmFMRzFDUVVGdFFqdERRVU51UWl4clFrRkJhMEk3UTBGRGJFSXNWMEZCVnp0RFFVTllMR0ZCUVdFN1EwRkRZaXhaUVVGWk8wTkJRMW9zWjBKQlFXZENPME5CUTJoQ0xHZENRVUZuUWp0RFFVTm9RaXhqUVVGak8wTkJRMlFzWlVGQlpUdERRVU5tTEhGRFFVRnhRenRCUVVOMFF6czdRVUZGUVR0RFFVTkRMSGxDUVVGcFFqdEpRVUZxUWl4elFrRkJhVUk3UzBGQmFrSXNjVUpCUVdsQ08xTkJRV3BDTEdsQ1FVRnBRanRCUVVOc1FqczdRVUZGUVR0RFFVTkRMR2RDUVVGblFqdERRVU5vUWl4WFFVRlhPME5CUTFnc1owSkJRV2RDTzBOQlEyaENMR3RDUVVGclFqdERRVU5zUWl3clEwRkJLME03UVVGRGFFUTdPMEZCUlVFN1EwRkRReXhoUVVGaE8wTkJRMklzWVVGQllUdEJRVU5rT3p0QlFVVkJPME5CUTBNc1ZVRkJWVHREUVVOV0xGZEJRVmM3UTBGRFdDeFpRVUZaTzBOQlExb3NWMEZCVnp0RFFVTllMSEZEUVVGeFF6dERRVU55UXl4blFrRkJaMEk3UVVGRGFrSTdPMEZCUlVFN1EwRkRReXhwUTBGQmVVSTdVMEZCZWtJc2VVSkJRWGxDTzBOQlEzcENMR2REUVVGM1FqdFRRVUY0UWl4M1FrRkJkMEk3UTBGRGVFSXNjVU5CUVRaQ08xTkJRVGRDTERaQ1FVRTJRanREUVVNM1FpdzJRa0ZCY1VJN1UwRkJja0lzY1VKQlFYRkNPMEZCUTNSQ096dEJRVVZCTzBOQlEwTXNlVUpCUVhsQ08wTkJRM3BDTEd0Q1FVRnJRanREUVVOc1FpeFpRVUZaTzBOQlExb3NaVUZCWlR0RFFVTm1MRmxCUVZrN1EwRkRXaXhsUVVGbE8wTkJRMllzWlVGQlpUdERRVU5tTEd0Q1FVRnJRanREUVVOc1FpeHJRa0ZCYTBJN1EwRkRiRUlzWjBKQlFXZENPMEZCUTJwQ096dEJRVVZCTzBOQlEwTXNZVUZCWVR0QlFVTmtPenRCUVVWQk8wTkJRME1zWVVGQllUdERRVU5pTEZWQlFWVTdRVUZEV0RzN1FVRkZRVHREUVVORExHRkJRV0U3UTBGRFlpeFZRVUZWTzBGQlExZzdRVUZEUVR0RFFVTkRMR0ZCUVdFN1EwRkRZaXhWUVVGVk8wRkJRMWc3TzBGQlJVRTdRMEZEUXl4aFFVRmhPME5CUTJJc1ZVRkJWVHRCUVVOWU8wRkJRMEU3UTBGRFF5eFpRVUZaTzBOQlExb3NWVUZCVlR0RFFVTldMR05CUVdNN1EwRkRaQ3gzUWtGQmQwSTdRMEZEZUVJc09FSkJRVGhDTzBGQlF5OUNPenRCUVVWQk8wTkJRME1zV1VGQldUdERRVU5hTEZWQlFWVTdRMEZEVml4WlFVRlpPME5CUTFvc09FSkJRVGhDTzBGQlF5OUNPenM3UVVGSFFUdERRVU5ETEZkQlFWYzdRMEZEV0N4VlFVRlZPME5CUTFZc1dVRkJXVHREUVVOYUxGZEJRVmM3TzBGQlJWbzdPMEZCUlVFN08wTkJSVU1zVlVGQlZUdERRVU5XTEcxQ1FVRnRRanREUVVOdVFpeGhRVUZoTzBOQlEySXNkMEpCUVhkQ08wTkJRM2hDTEd0Q1FVRnJRanREUVVOc1FpeFBRVUZQTzBOQlExQXNVVUZCVVR0RFFVTlNMRlZCUVZVN1EwRkRWaXhUUVVGVE8wTkJRMVFzWlVGQlpUdEJRVU5vUWp0QlFVTkJPME5CUTBNc1UwRkJVenRCUVVOV08wRkJRMEU3UTBGRFF5eGhRVUZoTzBGQlEyUTdRVUZEUVR0RFFVTkRMRkZCUVZFN1EwRkRVaXhyUWtGQmEwSTdRMEZEYkVJc1QwRkJUenREUVVOUUxGVkJRVlU3UTBGRFZpeFRRVUZUTzBOQlExUXNaVUZCWlR0QlFVTm9RanRCUVVOQk8wTkJRME1zWTBGQll6dEJRVU5tTzBGQlEwRTdRMEZEUXl4alFVRmpPMEZCUTJZN08wRkJSVUU3UTBGRFF5eFZRVUZWTzBGQlExZzdPMEZCUlVFN1EwRkRReXhyUWtGQmEwSTdRMEZEYkVJc2QwSkJRWGRDTzBOQlEzaENMRTlCUVU4N1FVRkRVanM3UVVGRlFUdERRVU5ETEhOQ1FVRnpRanREUVVOMFFpeHhRa0ZCY1VJN1EwRkRja0lzVjBGQlZ6dERRVU5ZTEdkQ1FVRm5RanRCUVVOcVFqczdRVUZGUVR0RFFVTkRMRGhDUVVFNFFqdERRVU01UWl4clFrRkJhMEk3UTBGRGJFSXNWMEZCVnp0RFFVTllMRmRCUVZjN1EwRkRXQ3huUWtGQlowSTdRMEZEYUVJc2EwSkJRV3RDTzBsQlEyWXNZVUZCWVR0SlFVTmlMSFZDUVVGMVFqdEpRVU4yUWl4eFFrRkJjVUk3UVVGRGVrSTdPMEZCUlVFN1EwRkRReXhoUVVGaE8wTkJRMklzVjBGQlZ6dEJRVU5hT3p0QlFVVkJPME5CUTBNc2JVSkJRVzFDTzBOQlEyNUNMR3RDUVVGclFqdERRVU5zUWl4WlFVRlpPME5CUTFvc2FVSkJRV2xDTzBOQlEycENMR1ZCUVdVN1FVRkRhRUk3UVVGRFFUdERRVU5ETEZkQlFWYzdRVUZEV2pzN08wRkJSMEU3UTBGRFF6dEZRVU5ETEZWQlFWVTdSVUZEVml4VFFVRlRPMFZCUTFRc1dVRkJXVHRGUVVOYUxEWkNRVUUyUWp0RFFVTTVRanM3UTBGRlFUdEZRVU5ETEZWQlFWVTdSVUZEVml4aFFVRmhPMFZCUTJJc1dVRkJXVHRGUVVOYUxEWkNRVUUyUWp0RlFVTTNRaXhuUTBGQlowTTdRMEZEYWtNN1FVRkRSRHM3TzBGQlprRTdRMEZEUXp0RlFVTkRMRlZCUVZVN1JVRkRWaXhUUVVGVE8wVkJRMVFzV1VGQldUdEZRVU5hTERaQ1FVRTJRanREUVVNNVFqczdRMEZGUVR0RlFVTkRMRlZCUVZVN1JVRkRWaXhoUVVGaE8wVkJRMklzV1VGQldUdEZRVU5hTERaQ1FVRTJRanRGUVVNM1FpeG5RMEZCWjBNN1EwRkRha003UVVGRFJEczdRVUZGUVR0RFFVTkRMRzFDUVVGdFFqdEJRVU53UWpzN1FVRkZRVHM3UTBGRlF5eDVRa0ZCZVVJN1FVRkRNVUk3TzBGQlJVRTdRMEZEUXl4NVFrRkJlVUk3UVVGRE1VSTdRVUZEUVR0RFFVTkRMRGhDUVVFNFFqdEJRVU12UWp0QlFVTkJPME5CUTBNc2QwSkJRWGRDTzBGQlEzcENPenRCUVVWQk8wTkJRME03WVVGRFdUdEJRVU5pTzBGQlEwRTdRMEZEUXl4aFFVRmhPMEZCUTJRN1FVRkRRU3hMUVVGTE96czdRVUZIVER0RFFVTkRMR2xDUVVGcFFqdERRVU5xUWl4VFFVRlRPME5CUTFRc2QwSkJRWGRDTzBGQlEzcENPenRCUVVWQk8wTkJRME1zVTBGQlV6dEJRVU5XT3pzN1FVRkhRVHREUVVORExGZEJRVmM3UTBGRFdDeHhRa0ZCY1VJN1EwRkRja0lzTWtKQlFUSkNPME5CUXpOQ0xEQnBaRUZCTUdsa08wTkJRekZwWkN3cmFVVkJRU3RwUlR0QlFVTm9ha1U3TzBGQlJVRTdRMEZEUXl4VlFVRlZPME5CUTFZc1YwRkJWenREUVVOWUxITnVSa0ZCYzI1R08wTkJRM1J1Uml4MVFrRkJkVUk3UTBGRGRrSXNNa0pCUVRKQ08wRkJRelZDTzBGQlEwRTdRMEZEUXl4VlFVRlZPME5CUTFZc1YwRkJWenREUVVOWUxIRXdTa0ZCY1RCS08wTkJRM0l3U2l4MVFrRkJkVUk3UTBGRGRrSXNNa0pCUVRKQ08wRkJRelZDT3p0QlFVVkJPME5CUTBNc1ZVRkJWVHREUVVOV0xGZEJRVmM3UTBGRFdDeHBNMFJCUVdrelJEdERRVU5xTTBRc2RVSkJRWFZDTzBOQlEzWkNMREpDUVVFeVFqdEJRVU0xUWlJc0ltWnBiR1VpT2lKemNtTXZZMjl0Y0c5dVpXNTBjeTlLVTBWRFlYQjBZMmhoTG5OMlpXeDBaU0lzSW5OdmRYSmpaWE5EYjI1MFpXNTBJanBiSWx4dUx5b3FYRzRxSUVaTVFWUmNiaW9xTDF4dUkwcFRSUzFEWVhCMFkyaGhMbVpzWVhRZ2UxeHVYSFJpWVdOclozSnZkVzVrT2lCdWIyNWxPMXh1WEhSd1lXUmthVzVuT2lBd2NIZzdYRzU5WEc1Y2JpTktVMFV0UTJGd2RHTm9ZUzVtYkdGMElHUmxkR0ZwYkhNZ2UxeHVYSFJpYjNndGMyaGhaRzkzT2lBd2NIZ2dNSEI0SURCd2VDQTBjSGdnY21kaVlTZ3dMQ0F3TENBd0xDQXdMakEyS1R0Y2JuMWNibHh1THlvcUtpb3ZYRzVjYmx4dUx5b3FYRzRxSUZOTlFVeE1YRzRxS2k5Y2JpTktVMFV0UTJGd2RHTm9ZUzVUSUh0Y2JseDBZbTl5WkdWeUxYSmhaR2wxY3pvZ05uQjRPMXh1WEhSd1lXUmthVzVuT2lBNGNIZzdYRzVjZEcxaGNtZHBiam9nTlhCNE8xeHVYSFJtYjI1MExYTnBlbVU2SURFeGNIZzdYRzU5WEc1Y2JpTktVMFV0UTJGd2RHTm9ZUzVUSUNOS1UwVXRhVzV3ZFhRZ2UxeHVYSFJvWldsbmFIUTZJREl3Y0hnN1hHNWNkRzFwYmkxM2FXUjBhRG9nTWpCd2VEdGNibHgwWm05dWRDMXphWHBsT2lBeE5YQjRPMXh1WEhSaWIzSmtaWEk2SUhOdmJHbGtJREZ3ZUNBalJETkVPRVJFTzF4dVhIUndZV1JrYVc1bk9pQXhjSGc3WEc1Y2RHMWhjbWRwYmpvZ05uQjRPMXh1ZlZ4dVhHNGpTbE5GTFVOaGNIUmphR0V1VXlBalNsTkZMV0p5WVc1a0lIdGNibHgwZDJsa2RHZzZJRE13Y0hnN1hHNGdJQ0FnYUdWcFoyaDBPaUF6T0hCNE8xeHVYSFJpYjNKa1pYSXRiR1ZtZERvZ2MyOXNhV1FnTW5CNElDTkdPVVk1UmprN1hHNTlYRzVjYmlOS1UwVXRRMkZ3ZEdOb1lTNVRJQ05LVTBVdFluSmhibVFnYzNabklIdGNibHgwZDJsa2RHZzZJREkwY0hnN1hHNTlYRzVjYmlOS1UwVXRRMkZ3ZEdOb1lTNVRMbVpzWVhRZ1pHVjBZV2xzY3lCN1hHNWNkR0p2ZUMxemFHRmtiM2M2SURCd2VDQXdjSGdnTUhCNElESndlQ0J5WjJKaEtEQXNJREFzSURBc0lEQXVNRFlwTzF4dWZWeHVJMHBUUlMxRFlYQjBZMmhoTGxNdWMzVmpZMlZ6Y3lBalNsTkZMV2x1Y0hWMElIdGNibHgwYldsdUxYZHBaSFJvT2pVeWNIZzdYRzU5WEc0dktpb3FLaTljYmx4dUx5b3FYRzRxSUUxRlJFbFZUVnh1S2lvdlhHNGpTbE5GTFVOaGNIUmphR0V1VFNCN1hHNWNkR0p2Y21SbGNpMXlZV1JwZFhNNklEWndlRHRjYmx4MGNHRmtaR2x1WnpvZ09IQjRPMXh1WEhSdFlYSm5hVzQ2SURWd2VEdGNibHgwWm05dWRDMXphWHBsT2lBeE5uQjRPMXh1ZlZ4dVhHNGpTbE5GTFVOaGNIUmphR0V1VFNBalNsTkZMV2x1Y0hWMElIdGNibHgwYUdWcFoyaDBPaUF6TUhCNE8xeHVYSFJ0YVc0dGQybGtkR2c2SURNd2NIZzdYRzVjZEdadmJuUXRjMmw2WlRvZ01qQndlRHRjYmx4MFltOXlaR1Z5T2lCemIyeHBaQ0F5Y0hnZ0kwUXpSRGhFUkR0Y2JseDBiV0Z5WjJsdU9pQTRjSGc3WEc1OVhHNWNiaU5LVTBVdFEyRndkR05vWVM1TklDTktVMFV0WW5KaGJtUWdlMXh1WEhSM2FXUjBhRG9nTXpod2VEdGNibHgwWW05eVpHVnlMV3hsWm5RNklITnZiR2xrSURKd2VDQWpSamxHT1VZNU8xeHVYSFJvWldsbmFIUTZOVEJ3ZUR0Y2JuMWNibHh1STBwVFJTMURZWEIwWTJoaExrMGdJMHBUUlMxaWNtRnVaQ0J6ZG1jZ2UxeHVYSFIzYVdSMGFEb2dNelJ3ZUR0Y2JuMWNibHh1STBwVFJTMURZWEIwWTJoaExrMHVabXhoZENCa1pYUmhhV3h6SUh0Y2JseDBZbTk0TFhOb1lXUnZkem9nTUhCNElEQndlQ0F3Y0hnZ01uQjRJSEpuWW1Fb01Dd2dNQ3dnTUN3Z01DNHdOaWs3WEc1OVhHNGpTbE5GTFVOaGNIUmphR0V1VFM1emRXTmpaWE56SUNOS1UwVXRhVzV3ZFhRZ2UxeHVYSFJ0YVc0dGQybGtkR2c2TnpCd2VEdGNibjFjYmk4cUtpb3FMMXh1WEc0dktpcGNiaW9nVEVGU1IwVmNiaW9xTDF4dUkwcFRSUzFEWVhCMFkyaGhMa3dnZTMxY2JseHVJMHBUUlMxRFlYQjBZMmhoTG5OMVkyTmxjM01nSTBwVFJTMXBibkIxZENCN1hHNWNkRzFwYmkxM2FXUjBhRG81TW5CNE8xeHVmVnh1STBwVFJTMURZWEIwWTJoaElDTktVMFV0WW5KaGJtUWdlMXh1WEhSb1pXbG5hSFE2Tmpod2VGeHVmVnh1THlvcUtpb3ZYRzVjYmx4dUx5b3FYRzRxSUVKQlUwVmNiaW9xTDF4dUkyTmhjSFJqYUdGRGFHVmpheUI3SUZ4dVhIUmthWE53YkdGNU9tNXZibVU3WEc1OVhHNGpTbE5GTFVOaGNIUmphR0VnZTF4dVhIUmthWE53YkdGNU9tNXZibVU3WEc1Y2RHSmhZMnRuY205MWJtUTZJQ05HTWtZNFJrWTdYRzVjZEdKdmNtUmxjaTF5WVdScGRYTTZJRFp3ZUR0Y2JseDBZMnhsWVhJNklHSnZkR2c3WEc1Y2RIQmhaR1JwYm1jNklERXpjSGc3WEc1Y2RHMWhjbWRwYmpvZ01UQndlRHRjYmx4MGJXbHVMWGRwWkhSb09pQXlNREJ3ZUR0Y2JseDBiV0Y0TFhkcFpIUm9PaUF6TVRSd2VEdGNibHgwWTI5c2IzSTZJQ00zTURjd056QTdYRzVjZEdadmJuUXRjMmw2WlRvZ01qQndlRHRjYmx4MFptOXVkQzFtWVcxcGJIazZJQ2ROYjI1MGMyVnljbUYwSnl3Z2MyRnVjeTF6WlhKcFpqdGNibjFjYmx4dUkwcFRSUzFEWVhCMFkyaGhJQ29nZTF4dVhIUjFjMlZ5TFhObGJHVmpkRG9nYm05dVpUdGNibjFjYmx4dUkwcFRSUzFEWVhCMFkyaGhJR1JsZEdGcGJITWdlMXh1WEhSdmRtVnlabXh2ZHpvZ2FHbGtaR1Z1TzF4dVhIUnRZWEpuYVc0NklEQndlRHRjYmx4MFltRmphMmR5YjNWdVpEb2dJMlptWmp0Y2JseDBZbTl5WkdWeUxYSmhaR2wxY3pvZ05IQjRPMXh1WEhSaWIzZ3RjMmhoWkc5M09pQXdjSGdnTTNCNElEWndlQ0F3Y0hnZ2NtZGlZU2d3TENBd0xDQXdMQ0F3TGpFeUtUdGNibjFjYmx4dUkwcFRSUzFEWVhCMFkyaGhJR1JsZEdGcGJITWdjM1Z0YldGeWVTQjdYRzVjZEdScGMzQnNZWGs2SUdac1pYZzdYRzVjZEc5MWRHeHBibVU2SUc1dmJtVTdYRzU5WEc1Y2JpTktVMFV0UTJGd2RHTm9ZU0JrWlhSaGFXeHpJQ05LVTBVdFEyRndkR05vWVVScGMzQnNZWGtnZTF4dVhIUnZjR0ZqYVhSNU9pQXdPMXh1WEhSdFlYSm5hVzQ2SURCd2VEdGNibHgwY0dGa1pHbHVaem9nTUhCNE8xeHVYSFJvWldsbmFIUTZJREJ3ZUR0Y2JseDBkSEpoYm5OcGRHbHZiam9nYjNCaFkybDBlU0F3TGpKekxDQm9aV2xuYUhRZ01DNDBjenRjYmx4MFltRmphMmR5YjNWdVpEb2dJMlptWmp0Y2JuMWNibHh1STBwVFJTMURZWEIwWTJoaElHUmxkR0ZwYkhNdVkyRndkR05vWVZCaGJtVnNXMjl3Wlc1ZElDTktVMFV0UTJGd2RHTm9ZVVJwYzNCc1lYa2dlMXh1WEhSaGJtbHRZWFJwYjI0dGJtRnRaVG9nYzJ4cFpHVkViM2R1TzF4dVhIUmhibWx0WVhScGIyNHRaSFZ5WVhScGIyNDZJREF1TTNNN1hHNWNkR0Z1YVcxaGRHbHZiaTFtYVd4c0xXMXZaR1U2SUdadmNuZGhjbVJ6TzF4dVhIUmhibWx0WVhScGIyNHRaR1ZzWVhrNklEQXVNM003WEc1OVhHNWNiaU5LVTBVdFEyRndkR05vWVNBalNsTkZMV2x1Y0hWMElIdGNibHgwWW05eVpHVnlPaUJ6YjJ4cFpDQTBjSGdnSTBRelJEaEVSRHRjYmx4MFltOXlaR1Z5TFhKaFpHbDFjem9nTkhCNE8xeHVYSFJ0WVhKbmFXNDZJREV3Y0hnN1hHNWNkRzFwYmkxM2FXUjBhRG9nTkRCd2VEdGNibHgwYUdWcFoyaDBPaUEwTUhCNE8xeHVYSFJqZFhKemIzSTZJSEJ2YVc1MFpYSTdYRzVjZEdadmJuUXRjMmw2WlRvZ01qaHdlRHRjYmx4MGRHVjRkQzFoYkdsbmJqb2dZMlZ1ZEdWeU8xeHVYSFJ3YjNOcGRHbHZiam9nY21Wc1lYUnBkbVU3WEc1Y2RHOTJaWEptYkc5M09pQm9hV1JrWlc0N1hHNTlYRzVjYmlOS1UwVXRRMkZ3ZEdOb1lTQmtaWFJoYVd4elBuTjFiVzFoY25rNk9pMTNaV0pyYVhRdFpHVjBZV2xzY3kxdFlYSnJaWElnZTF4dVhIUmthWE53YkdGNU9pQnViMjVsTzF4dWZWeHVYRzRqU2xORkxVTmhjSFJqYUdFZ1pHVjBZV2xzY3lBalNsTkZMV2x1Y0hWME9taHZkbVZ5T21KbFptOXlaU0I3WEc1Y2RHTnZiblJsYm5RNklDZnduNlNXSnp0Y2JseDBiM0JoWTJsMGVUb2dNVHRjYm4xY2JseHVJMHBUUlMxRFlYQjBZMmhoTG5OMVkyTmxjM01nWkdWMFlXbHNjeUFqU2xORkxXbHVjSFYwT21KbFptOXlaU0I3WEc1Y2RHTnZiblJsYm5RNklDZnduNWlKSnp0Y2JseDBiM0JoWTJsMGVUb2dNVHRjYm4xY2JpTktVMFV0UTJGd2RHTm9ZUzVtWVdsc1pXUWdaR1YwWVdsc2N5QWpTbE5GTFdsdWNIVjBPbUpsWm05eVpTQjdYRzVjZEdOdmJuUmxiblE2SUNmd242U1dKenRjYmx4MGIzQmhZMmwwZVRvZ01UdGNibjFjYmx4dUkwcFRSUzFEWVhCMFkyaGhMblJvYVc1cmFXNW5JR1JsZEdGcGJITWdJMHBUUlMxcGJuQjFkRHBpWldadmNtVWdlMXh1WEhSamIyNTBaVzUwT2lBbjhKK2tvU2M3WEc1Y2RHOXdZV05wZEhrNklERTdYRzU5WEc0alNsTkZMVU5oY0hSamFHRXVjM1ZqWTJWemN5QmtaWFJoYVd4eklDTktVMFV0YVc1d2RYUTZZV1owWlhJZ2UxeHVYSFJqYjI1MFpXNTBPaUFuNHB5VUp6dGNibHgwYjNCaFkybDBlVG9nTVR0Y2JseDBZMjlzYjNJNklDTXlOa0ZGTmpBN1hHNWNkSEJoWkdScGJtYzZJREJ3ZUNBMGNIZ2dNSEI0SURWd2VEdGNibHgwWW05eVpHVnlMV3hsWm5RNklITnZiR2xrSURKd2VDQWpSRE5FT0VSRU8xeHVmVnh1WEc0alNsTkZMVU5oY0hSamFHRXVabUZwYkdWa0lHUmxkR0ZwYkhNZ0kwcFRSUzFwYm5CMWREcGhablJsY2lCN1hHNWNkR052Ym5SbGJuUTZJQ2ZpbTVRbk8xeHVYSFJ2Y0dGamFYUjVPaUF4TzF4dVhIUndZV1JrYVc1bk9pQXdjSGc3WEc1Y2RHSnZjbVJsY2kxc1pXWjBPaUJ6YjJ4cFpDQXljSGdnSTBRelJEaEVSRHRjYm4xY2JseHVYRzRqU2xORkxVTmhjSFJqYUdFdWMzVmpZMlZ6Y3lCa1pYUmhhV3h6TG1OaGNIUmphR0ZRWVc1bGJGdHZjR1Z1WFNBalNsTkZMV2x1Y0hWME9tRm1kR1Z5SUh0Y2JseDBZMjl1ZEdWdWREb2dKeWM3WEc1Y2RHOXdZV05wZEhrNklEQTdYRzVjZEhCaFpHUnBibWM2SURCd2VEdGNibHgwWW05eVpHVnlPaUF3Y0hnN1hHNWNkRnh1ZlZ4dVhHNGpTbE5GTFVOaGNIUmphR0VnWkdWMFlXbHNjeUFqU2xORkxXbHVjSFYwT21KbFptOXlaU3hjYmlOS1UwVXRRMkZ3ZEdOb1lTQmtaWFJoYVd4ekxtTmhjSFJqYUdGUVlXNWxiRnR2Y0dWdVhTQWpTbE5GTFdsdWNIVjBPbUpsWm05eVpTQjdYRzVjZEc5d1lXTnBkSGs2SURBN1hHNWNkQzhxWm05dWRDMXphWHBsT2lBeU9IQjRPeW92WEc1Y2RHTnZiblJsYm5RNklDZnduNlNXSnp0Y2JseDBkSEpoYm5OcGRHbHZiam9nYjNCaFkybDBlU0F3TGpKek8xeHVYSFJ3YjNOcGRHbHZiam9nWVdKemIyeDFkR1U3WEc1Y2RIUnZjRG93Y0hnN1hHNWNkR3hsWm5RNk1IQjRPMXh1WEhSaWIzUjBiMjA2TUhCNE8xeHVYSFJ5YVdkb2REb3djSGc3WEc1Y2RHSmhZMnRuY205MWJtUTZJMlptWmp0Y2JuMWNiaU5LVTBVdFEyRndkR05vWVM1emRXTmpaWE56SUdSbGRHRnBiSE11WTJGd2RHTm9ZVkJoYm1Wc0lDTktVMFV0YVc1d2RYUTZZbVZtYjNKbElIdGNibHgwY21sbmFIUTZOVEFsTzF4dWZWeHVJMHBUUlMxRFlYQjBZMmhoTG5OMVkyTmxjM01nWkdWMFlXbHNjeTVqWVhCMFkyaGhVR0Z1Wld4YmIzQmxibDBnSTBwVFJTMXBibkIxZERwaFpuUmxjaUI3WEc1Y2RHUnBjM0JzWVhrNklHNXZibVU3WEc1OVhHNGpTbE5GTFVOaGNIUmphR0V1YzNWalkyVnpjeUJrWlhSaGFXeHpMbU5oY0hSamFHRlFZVzVsYkNBalNsTkZMV2x1Y0hWME9tRm1kR1Z5SUh0Y2JseDBiR1ZtZERvMU1DVTdYRzVjZEhCdmMybDBhVzl1T2lCaFluTnZiSFYwWlR0Y2JseDBkRzl3T2pCd2VEdGNibHgwWW05MGRHOXRPakJ3ZUR0Y2JseDBjbWxuYUhRNk1IQjRPMXh1WEhSaVlXTnJaM0p2ZFc1a09pTm1abVk3WEc1OVhHNGpTbE5GTFVOaGNIUmphR0V1YzNWalkyVnpjeUFqU2xORkxXbHVjSFYwSUh0Y2JseDBiV2x1TFhkcFpIUm9Pamt5Y0hnN1hHNTlYRzRqU2xORkxVTmhjSFJqYUdFdWMzVmpZMlZ6Y3lCa1pYUmhhV3h6TG1OaGNIUmphR0ZRWVc1bGJGdHZjR1Z1WFNBalNsTkZMV2x1Y0hWMElIdGNibHgwYldsdUxYZHBaSFJvT2pJd2NIZzdYRzU5WEc1Y2JpTktVMFV0UTJGd2RHTm9ZU0JrWlhSaGFXeHpMbU5oY0hSamFHRlFZVzVsYkZ0dmNHVnVYU0FqU2xORkxXbHVjSFYwT21KbFptOXlaU0I3WEc1Y2RHOXdZV05wZEhrNklERTdYRzU5WEc1Y2JpTktVMFV0UTJGd2RHTm9ZU0FqU2xORkxXMXpaeUI3WEc1Y2RHRnNhV2R1TFhObGJHWTZJR05sYm5SbGNqdGNibHgwY0dGa1pHbHVaem9nTUhCNElEQndlQ0F3Y0hnZ05IQjRPMXh1WEhSbWJHVjRPaUF4TzF4dWZWeHVYRzRqU2xORkxVTmhjSFJqYUdFZ0kwcFRSUzF0YzJjZ2NDQjdYRzVjZEhabGNuUnBZMkZzTFdGc2FXZHVPaUJpYjNSMGIyMDdYRzVjZEdScGMzQnNZWGs2SUdsdWJHbHVaUzFpYkc5amF6dGNibHgwYldGeVoybHVPaUF3Y0hnN1hHNWNkR3hwYm1VdGFHVnBaMmgwT2lBeExqSTdYRzU5WEc1Y2JpTktVMFV0UTJGd2RHTm9ZU0FqU2xORkxXSnlZVzVrSUh0Y2JseDBZbTl5WkdWeUxXeGxablE2SUhOdmJHbGtJRE53ZUNBalJqbEdPVVk1TzF4dVhIUmhiR2xuYmkxelpXeG1PaUJqWlc1MFpYSTdYRzVjZEhkcFpIUm9PaUEyTUhCNE8xeHVYSFJvWldsbmFIUTZOamh3ZUR0Y2JseDBjR0ZrWkdsdVp6b2dNSEI0SURSd2VEdGNibHgwZEdWNGRDMWhiR2xuYmpvZ1kyVnVkR1Z5TzF4dUlDQWdJR1JwYzNCc1lYazZJR1pzWlhnN1hHNGdJQ0FnYW5WemRHbG1lUzFqYjI1MFpXNTBPaUJqWlc1MFpYSTdYRzRnSUNBZ1lXeHBaMjR0WTI5dWRHVnVkRG9nWTJWdWRHVnlPMXh1ZlZ4dVhHNGpTbE5GTFVOaGNIUmphR0VnSTBwVFJTMWljbUZ1WkNCemRtY2dlMXh1WEhSbWFXeHNPaUFqTlRGQ1JrVkRPMXh1WEhSM2FXUjBhRG9nTkRod2VEdGNibjFjYmx4dUkwcFRSUzFEWVhCMFkyaGhJQ05LVTBVdFEyRndkR05vWVVScGMzQnNZWGtnSTBwVFJTMWpZWEIwWTJoaExXZGhiV1V0WTI5dWRHRnBibVZ5SUh0Y2JseDBZbUZqYTJkeWIzVnVaRG9nSTBZeVJqaEdSanRjYmx4MFltOXlaR1Z5TFhKaFpHbDFjem9nTm5CNE8xeHVYSFJvWldsbmFIUTZJREV3TUNVN1hHNWNkSEJ2YzJsMGFXOXVPbkpsYkdGMGFYWmxPMXh1WEhSdmRtVnlabXh2ZHpwb2FXUmtaVzQ3WEc1OVhHNGpTbE5GTFVOaGNIUmphR0VnSTBwVFJTMURZWEIwWTJoaFJHbHpjR3hoZVNBalNsTkZMV05oY0hSamFHRXRaMkZ0WlNCN1hHNWNkR2hsYVdkb2REb3hNREFsTzF4dWZWeHVYRzVjYmtCclpYbG1jbUZ0WlhNZ2MyeHBaR1ZFYjNkdUlIdGNibHgwWm5KdmJTQjdYRzVjZEZ4MGIzQmhZMmwwZVRvZ01EdGNibHgwWEhSb1pXbG5hSFE2SURBN1hHNWNkRngwY0dGa1pHbHVaem9nT0hCNE8xeHVYSFJjZEdKdmNtUmxjaTEwYjNBNklITnZiR2xrSURSd2VDQWpSamxHT1VZNU8xeHVYSFI5WEc1Y2JseDBkRzhnZTF4dVhIUmNkRzl3WVdOcGRIazZJREU3WEc1Y2RGeDBhR1ZwWjJoME9pQXhPVEJ3ZUR0Y2JseDBYSFJ3WVdSa2FXNW5PaUE0Y0hnN1hHNWNkRngwWW05eVpHVnlMWFJ2Y0RvZ2MyOXNhV1FnTkhCNElDTkdPVVk1UmprN1hHNWNkRngwTHlwb1pXbG5hSFE2SUhaaGNpZ3RMV052Ym5SbGJuUklaV2xuYUhRcE95b3ZYRzVjZEgxY2JuMWNibHh1STBwVFJTMURZWEIwWTJoaElHUmxkR0ZwYkhNZ0kwcFRSUzF0YzJjK2NEcGhablJsY2lCN1hHNWNkR052Ym5SbGJuUTZJQ2RKYlNCb2RXMWhiaWM3WEc1OVhHNWNiaU5LVTBVdFEyRndkR05vWVNCa1pYUmhhV3h6TG1OaGNIUmphR0ZRWVc1bGJGdHZjR1Z1WFNBalNsTkZMVzF6Wno1d09tRm1kR1Z5TEZ4dUkwcFRSUzFEWVhCMFkyaGhMbk4xWTJObGMzTWdaR1YwWVdsc2N5NWpZWEIwWTJoaFVHRnVaV3hiYjNCbGJsMGdJMHBUUlMxdGMyYytjRHBoWm5SbGNpQjdYRzVjZEdOdmJuUmxiblE2SUNkSmJTQnViM1FnWVNCeWIySnZkQ2M3WEc1OVhHNWNiaU5LVTBVdFEyRndkR05vWVM1emRXTmpaWE56SUdSbGRHRnBiSE1nSTBwVFJTMXRjMmMrY0RwaFpuUmxjaUI3WEc1Y2RHTnZiblJsYm5RNklDZFdaWEpwWm1sbFpDQm9kVzFoYmljN1hHNTlYRzRqU2xORkxVTmhjSFJqYUdFdVptRnBiR1ZrSUdSbGRHRnBiSE1nSTBwVFJTMXRjMmMrY0RwaFpuUmxjaUI3WEc1Y2RHTnZiblJsYm5RNklDZEdZV2xzWldRZ2RtVnlhV1pwWTJGMGFXOXVKenRjYm4xY2JpTktVMFV0UTJGd2RHTm9ZUzUwYUdsdWEybHVaeUJrWlhSaGFXeHpJQ05LVTBVdGJYTm5QbkE2WVdaMFpYSWdlMXh1WEhSamIyNTBaVzUwT2lBblZtVnlhV1o1YVc1bklDNHVMaWM3WEc1OVhHNWNiaU5LVTBVdGFXNXdkWFFnYVc1d2RYUmJkSGx3WlQxY0ltTm9aV05yWW05NFhDSmRJSHRjYmx4MEx5cHdiM05wZEdsdmJqb2dZV0p6YjJ4MWRHVTdYRzVjZEhSdmNEb2dMVFV3Y0hnN0tpOWNibjFjYmlOS1UwVXRRMkZ3ZEdOb1lTNWhZM1JwZG1VZ2UxeHVYSFJrYVhOd2JHRjVPbUpzYjJOck8xeHVmVnh1THlvcUtpb3ZYRzVjYmx4dUxtZG1lQ0I3WEc1Y2RIQnZjMmwwYVc5dU9tRmljMjlzZFhSbE8xeHVYSFJ2Y0dGamFYUjVPakU3WEc1Y2RIUnlZVzV6YVhScGIyNDZJRzl3WVdOcGRIa2dNQzQyY3p0Y2JuMWNibHh1TG1kbWVDNWhZM1JwZG1VZ2UxeHVYSFJ2Y0dGamFYUjVPakE3WEc1OVhHNWNibHh1TG1kaGJXVWdlMXh1WEhSb1pXbG5hSFE2TVRBd0pUdGNibHgwWW1GamEyZHliM1Z1WkMxemFYcGxPak0xTUhCNE8xeHVYSFJpWVdOclozSnZkVzVrTFhKbGNHVmhkRHB1YnkxeVpYQmxZWFE3WEc1Y2RHSmhZMnRuY205MWJtUXRhVzFoWjJVNmRYSnNLRndpWkdGMFlUcHBiV0ZuWlM5emRtY3JlRzFzTENVelEzTjJaeUI0Yld4dWN6MG5hSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY25JSGRwWkhSb1BTY3lOVFF1TnpNeUp5Qm9aV2xuYUhROUp6RTBNaTQyTlNjZ2RtbGxkMEp2ZUQwbk1DQXdJREkxTkM0M016SWdNVFF5TGpZMUp5VXpSU1V6UTNKbFkzUWdkMmxrZEdnOUp6STFOQzQzTXpJbklHaGxhV2RvZEQwbk1UUXlMalkxSnlCbWFXeHNQU2NsTWpNeU5qRXpObVVuTHlVelJTVXpRMmNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb01UTXVOems1SURndU16STJLU2NsTTBVbE0wTm5JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0RZMkxqY3lOU0F4Tmk0eE5UY3BKeVV6UlNVelEzQmhkR2dnWkQwblRUWXdNQzR3TkRJc01qWXhMamc0TTBFME5pNDRORElzTkRZdU9EUXlMREFzTVN3d0xEVTFNeTR5TERJeE5TNHdOREpoTkRZdU9UTXNORFl1T1RNc01Dd3dMREFzTkRZdU9EUXlMRFEyTGpnME1sb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MwMU5UTXVNaUF0TVRZNExqSXBKeUJtYVd4c1BTY2xNak16TXpFeE56Z25JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5Oak0zTGpBek9Td3lPVEl1TlRjNFFUUXdMalV6T1N3ME1DNDFNemtzTUN3eExEQXNOVGsyTGpVc01qVXlMakF6T1dFME1DNDJNVFlzTkRBdU5qRTJMREFzTUN3d0xEUXdMalV6T1N3ME1DNDFNemxhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3ROVGt3TGpFNU55QXRNakExTGpFNU55a25JR1pwYkd3OUp5VXlNek5oTVRVNE1DY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMDJPVFF1TlRReUxETTBNQzR5T0RWQk16QXVOelF6TERNd0xqYzBNeXd3TERFc01DdzJOak11T0N3ek1Ea3VOVFF6WVRNd0xqZ3dOeXd6TUM0NE1EY3NNQ3d3TERBc016QXVOelF5TERNd0xqYzBNMW9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMDJORGN1TnpBeElDMHlOakl1TnpBeEtTY2dabWxzYkQwbkpUSXpORFF4TlRobUp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRUYzFNUzQxTXpRc016ZzNMalUyTjBFeU1TNHdNelFzTWpFdU1ETTBMREFzTVN3d0xEY3pNQzQxTERNMk5pNDFNelJoTWpFdU1EY3lMREl4TGpBM01pd3dMREFzTUN3eU1TNHdNelFzTWpFdU1ETTBXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUY3dOQzQyT1RJZ0xUTXhPUzQyT1RJcEp5Qm1hV3hzUFNjbE1qTTFNakZpT1RZbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlROREwyY2xNMFVsTTBObklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLREFwSnlVelJTVXpRM0JoZEdnZ1pEMG5UVEV4TWk0ME1UTXNPVEl1TkRFeFFURTNMall3Tml3eE55NDJNRFlzTUN3eExEQXNPVFF1T0N3M05DNDRZVEUzTGpZME15d3hOeTQyTkRNc01Dd3dMREFzTVRjdU5qRXpMREUzTGpZeE0xb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MwNU5DNDRJQzAxTnk0eUtTY2dabWxzYkQwbkpUSXpNelF4TWpjd0p5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRURXlOaTR6TkN3eE1ETXVPVFkyWVRFMUxqSXpNeXd4TlM0eU16TXNNQ3d4TERBdE1UVXVNalF0TVRVdU1qUXNNVFV1TWpZc01UVXVNallzTUN3d0xEQXNNVFV1TWpRc01UVXVNalJhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RNVEE0TGpjeU55QXROekV1TVRJM0tTY2dabWxzYkQwbkpUSXpNMlF4TWpjekp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRURTBOeTQ1TlRnc01USXhMamxCTVRFdU5UVXNNVEV1TlRVc01Dd3hMREFzTVRNMkxqUXNNVEV3TGpNME15d3hNUzQxTnpNc01URXVOVGN6TERBc01Dd3dMREUwTnk0NU5UZ3NNVEl4TGpsYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TVRNd0xqTTBOU0F0T1RJdU56UTFLU2NnWm1sc2JEMG5KVEl6TkRreE1qYzVKeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVEUyT1M0MExERXpPUzQyTURoaE55NDVMRGN1T1N3d0xERXNNQzAzTGprdE55NDVMRGN1T1RJeExEY3VPVEl4TERBc01Dd3dMRGN1T1N3M0xqbGFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE1UVXhMamM1TVNBdE1URTBMakV3TmlrbklHWnBiR3c5SnlVeU16VTFNVFEzWmljZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBNdlp5VXpSU1V6UTJjZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9NVGt4TGpjM055QXhOQzQ1TURVcEp5VXpSU1V6UTNCaGRHZ2daRDBuVFRFME1UZ3VPVFV5TERFM01pNDVZVFl1TmpVeUxEWXVOalV5TERBc01Td3dMVFl1TmpVeUxUWXVOalV5TERZdU5qWXNOaTQyTml3d0xEQXNNQ3cyTGpZMU1pdzJMalkxTWxvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzB4TkRFeUxqTWdMVEUxT1M0MktTY2dabWxzYkQwbkpUSXpNelF4TWpjd0p5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRURTBNalF1TWpRNUxERTNOeTR6TVRSaE5TNDNOVGNzTlM0M05UY3NNQ3d4TERBdE5TNDNOUzAxTGpjMUxEVXVOemMwTERVdU56YzBMREFzTUN3d0xEVXVOelVzTlM0M05Wb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MweE5ERTNMalU1TnlBdE1UWTBMamc1T0NrbklHWnBiR3c5SnlVeU16TmtNVEkzTXljZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBOd1lYUm9JR1E5SjAweE5ETXlMak0yTnl3eE9EUXVNRE0wWVRRdU16WTNMRFF1TXpZM0xEQXNNU3d3TFRRdU16WTNMVFF1TXpZM0xEUXVNemdzTkM0ek9Dd3dMREFzTUN3MExqTTJOeXcwTGpNMk4xb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MweE5ESTFMamN4TlNBdE1UY3pMakF4TlNrbklHWnBiR3c5SnlVeU16UTVNVEkzT1NjZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBOd1lYUm9JR1E5SjAweE5EUXdMalE0TkN3eE9UQXVOelk0WVRJdU9UZzBMREl1T1RnMExEQXNNU3d3TFRJdU9UZzBMVEl1T1RnMExESXVPVGc0TERJdU9UZzRMREFzTUN3d0xESXVPVGcwTERJdU9UZzBXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xURTBNek11T0RNeUlDMHhPREV1TVRNeUtTY2dabWxzYkQwbkpUSXpOVFV4TkRkbUp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelF5OW5KVE5GSlROREwyY2xNMFVsTTBObklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLREU1T0M0NU9UY2dOalV1TkRnNEtTY2xNMFVsTTBOd1lYUm9JR1E5SjAweE16YzNMalF6TXl3ME56QXVNemhoTVRBdU1qUXNNVEF1TWpRc01Dd3hMREF0TVRBdU1qTXpMVEV3TGpJME55d3hNQzR5TmpNc01UQXVNall6TERBc01Dd3dMREV3TGpJek15d3hNQzR5TkRkYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TVRNMk55NHhPRFVnTFRRME9TNDVLU2NnWm1sc2JEMG5KVEl6WmpZMkp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRURXpPVEV1TURjMkxEUTBPUzQ1WVRFd0xqSTBMREV3TGpJMExEQXNNU3d4TERBc01qQXVORGhqTFRFdU1ETXpMUzR5TnpjdE15NHlMUzQwTlRFdE1pNDROVE10TVM0ME1USXVNVGMxTFM0ME9Dd3hMalUwTXk0eE9Ea3NNaTQ1TGpNd05pd3hMamd3TlM0eE16RXNNeTQzTFM0eU16TXNNeTQ1TVRZdExqZ3hOUzR6TURZdExqZzNNeTB4TGpnMk15MHVNamt4TFRRdU16WTNMUzQwTWpJdE1pNDVOamt0TGpFMkxUWXVNemMyTFRFdU1ETXpMVFl1TWpnNExUSXVOREUyTGpBM015MHhMakEwT0N3ekxqQTFOeTR6TURZc05pd3VOVFk0TERNc0xqSTNOeXcxTGprMU15MHVOVFV6TERZdU1URTBMVEl1TXk0eE5pMHhMamMzTmkweUxqY3pOeTB4TGpNeU5TMDJMakE0TkMweExqUXRNeTR4TXkwdU1EY3pMVGN1TVMweExqRXpOUzAzTGpJek5DMHpMakF5T0MwdU1UUTJMVEl1TURNNExETXVNRFUzTFRFdU1UazBMRFl1TURnMExURXVNalV5TERNdU1EVTNMUzR3TlRnc05TNDVOVE10TVM0d016UXNOUzQwTVRVdE15NHdOekV0TGpJNU1TMHhMakV3TmkweUxqRXhNUzB1TkRBNExUUXVNelkzTFM0ek1EWnpMVFF1T1RrekxTNHpOemd0TlM0eE5qY3RNUzR6TVdNdExqTXlMVEV1TnpRM0xETXVOemcwTFRNdU5EQTJMRFV1T1RNNUxUTXVOakkxV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVEV6T0RBdU9ESTVJQzAwTkRrdU9Ta25JR1pwYkd3OUp5VXlNMk0wTTJZMU55Y2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMHhNemMzTGpNME9DdzBORGt1T1dNdU16TTFMREFzTGpZM0xqQXhOUzQ1T1M0d05EUm9MUzR5TXpOaE1UQXVNalVzTVRBdU1qVXNNQ3d3TERBdExqazVMREl3TGpRMU1Td3hNQzR5TkRrc01UQXVNalE1TERBc01Dd3hMQzR5TXpNdE1qQXVOVm9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMHhNelkzTGpFZ0xUUTBPUzQ1S1NjZ1ptbHNiRDBuSlRJelpHWTVPV1ptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UXk5bkpUTkZKVE5EWnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZzNNaTR5TnpFZ016UXVNek00S1NjbE0wVWxNME53WVhSb0lHUTlKMDAwT1RndU56STNMREkwTUM0ek5UUmhNaTR5TWpjc01pNHlNamNzTUN3eExEQXRNaTR5TWpjdE1pNHlNamNzTWk0eU16WXNNaTR5TXpZc01Dd3dMREFzTWk0eU1qY3NNaTR5TWpkYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TkRrMkxqVWdMVEl6TlM0NUtTY2dabWxzYkQwbkpUSXpOMk14TXpjd0p5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRUVXdOUzQxT0Rrc01qTTRMak14TldFeUxqSXlPQ3d5TGpJeU9Dd3dMREFzTVMweExqSXlNeXcwTGpBNUxERXVOVGd5TERFdU5UZ3lMREFzTUN3eExTNHlOakl0TGpBeE5Td3lMakl5T0N3eUxqSXlPQ3d3TERBc01Td3hMakl5TXkwMExqQTVZeTR3T0Rjc01Dd3VNVGMxTGpBeE5TNHlOakl1TURFMVdpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRVd01pNHhNemtnTFRJek55NDVOVEVwSnlCbWFXeHNQU2NsTWpOaVpUSXpPRFVuSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5ETDJjbE0wVWxNME5uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtERXhNaTR3TWpRZ05UVXVPVGd6S1NjbE0wVWxNME53WVhSb0lHUTlKMDAzT0RRdU9UUXlMRFF4TlM0eU9EUkJNVFV1TXpReUxERTFMak0wTWl3d0xERXNNQ3czTmprdU5pd3pPVGt1T1RReVlURTFMak0zTWl3eE5TNHpOeklzTUN3d0xEQXNNVFV1TXpReUxERTFMak0wTWxvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzAzTmprdU5pQXRNemcwTGpZcEp5Qm1hV3hzUFNjbE1qTTJPRE00WVRRbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk9EQTBMakUyTnl3ME16RXVNak0wUVRFeUxqQTJOeXd4TWk0d05qY3NNQ3d4TERBc056a3lMakVzTkRFNUxqRTJOMkV4TWk0d09USXNNVEl1TURreUxEQXNNQ3d3TERFeUxqQTJOeXd4TWk0d05qZGFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE56ZzRMamd5TlNBdE5EQXpMamd5TlNrbklHWnBiR3c5SnlVeU16YzVOR1JoWlNjZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBOd1lYUm9JR1E5SjAwNE1Ua3VOekU0TERRME5DNHhNelpoT1M0ME1UZ3NPUzQwTVRnc01Dd3hMREF0T1M0ME1UZ3RPUzQwTVRnc09TNDBNek1zT1M0ME16TXNNQ3d3TERBc09TNDBNVGdzT1M0ME1UaGFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE9EQTBMak0zTmlBdE5ERTVMak0zTmlrbklHWnBiR3c5SnlVeU16bGxOMlZqTlNjZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBOd1lYUm9JR1E5SjAwNE1qY3VNVFV4TERRMU1DNHpRVGd1TVRVeExEZ3VNVFV4TERBc01Td3dMRGd4T1N3ME5ESXVNVFV4WVRndU1UWTJMRGd1TVRZMkxEQXNNQ3d3TERndU1UVXhMRGd1TVRVeFdpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRneE1TNDRNRGtnTFRReU5pNDRNRGtwSnlCbWFXeHNQU2NsTWpObVptWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRMMmNsTTBVbE0wTm5JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0RRMExqRXpOQ0F4TVRRdU1USXBKeVV6UlNVelEzQmhkR2dnWkQwblRUTXdNeTQ1T0RRc09EZzRMakUwTjJFdU56VTFMamMxTlN3d0xEQXNNU3d1TXprekxqRmpMakV4Tmk0d056TXNNVE11T1RjMExUY3VOemN6TERFMExqQTBOeTAzTGpZMU5uTXRNVE11TmpJMUxEZ3VNakV0TVRNdU5qSTFMRGd1TXpkaExqZ3VPQ3d3TERFc01TMHhMallzTUN3dU56a3VOemtzTUN3d0xERXNMamM0TmkwdU9ERTFXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUTXdNeTR4T1RjZ0xUZzJOaTQxTXpFcEp5Qm1hV3hzUFNjbE1qTm1abU1uSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTXpBMExqa3lOaXc1TXpRdU9UVXlZUzQyTWpZdU5qSTJMREFzTVN3d0xEQXRNUzR5TlRJdU5qSXhMall5TVN3d0xEQXNNQzB1TmpJMkxqWXlOaTQyTXpFdU5qTXhMREFzTUN3d0xDNDJNall1TmpJMldpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRNd05DNHhNemtnTFRreE1TNDVNRGtwSnlCbWFXeHNQU2NsTWpObVpqWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5NekExTGpneU1pdzVNell1TXpRMFlTNDBNakl1TkRJeUxEQXNNU3d3TFM0ME1qSXRMalF5TWk0ME1qSXVOREl5TERBc01Dd3dMQzQwTWpJdU5ESXlXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUTXdOUzR3TnprZ0xUa3hNeTQwTkRjcEp5Qm1hV3hzUFNjbE1qTm1ZekFuSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTkRJMUxqazBNeXczT1RZdU16Y3lZeTR3TWprdExqQXhOU3d5TVM0ek5qZ3RNVEl1TkRFMkxESXhMalF0TVRJdU16Y3pjeTB5TVM0eU1EZ3NNVEl1TlRreExUSXhMakkxTWl3eE1pNDJNbU10TGpJNU1TNHhOelV0TGpRd09DMHVNRGczTFM0eE5EWXRMakkwTjFvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzAwTURjdU9UVXhJQzAzT0RNdU9UazVLU2NnWm1sc2JEMG5KVEl6Wm1aakp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelF5OW5KVE5GSlRORFp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2czTGpjM015QTBMakE1S1NjbE0wVWxNME53WVhSb0lHUTlKMDAyTkRFdU9EWTBMREV4TVM0eU1UTmhMak0yTGpNMkxEQXNNQ3d3TEM0ek5qUXRMak0yTkM0ek5EZ3VNelE0TERBc01Dd3dMUzR6TmpRdExqTTBPUzR6TlRjdU16VTNMREFzTVN3d0xEQXNMamN4TTFvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzAxTlRVdU9EazJJQzA1T0M0MU1EWXBKeUJtYVd4c1BTY2xNak5tWm1ZbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk5EZ3dMalUyTkN3NE1TNDJNamhoTGpNMk5DNHpOalFzTUN3eExEQXRMak0yTkMwdU16WTBMak0zTGpNM0xEQXNNQ3d3TEM0ek5qUXVNelkwV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVFF4T0M0d056VWdMVGN6TGpJeE5Da25JR1pwYkd3OUp5VXlNMlptWmljZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBOd1lYUm9JR1E5SjAwME1UWXVNelkwTERJM09TNHlNamhoTGpNMk5DNHpOalFzTUN3eExEQXRMak0yTkMwdU16WTBMak0zTGpNM0xEQXNNQ3d3TEM0ek5qUXVNelkwV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVE0yTXk0eU1pQXRNalF5TGpBMU1Ta25JR1pwYkd3OUp5VXlNMlptWmljZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBOd1lYUm9JR1E5SjAwMU5UUXVNRFkwTERVek1DNHdNamhoTGpNMk5DNHpOalFzTUN3eExEQXRMak0yTkMwdU16WTBMak0zTGpNM0xEQXNNQ3d3TEM0ek5qUXVNelkwV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVFE0TUM0NE56WWdMVFExTmk0ek5EVXBKeUJtYVd4c1BTY2xNak5tWm1ZbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk5ESXhMakkyTkN3Mk5USXVNakV6WVM0ek5UY3VNelUzTERBc01Dd3dMQzR6TmpRdExqTTBPUzR6Tnk0ek55d3dMREFzTUMwdU16WTBMUzR6TmpRdU16VTNMak0xTnl3d0xERXNNQ3d3TEM0M01UTmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE16WTNMalF3TmlBdE5UWXdMamMxTnlrbklHWnBiR3c5SnlVeU0yWm1aaWNnWm1sc2JDMXlkV3hsUFNkbGRtVnViMlJrSnk4bE0wVWxNME53WVhSb0lHUTlKMDAwTnpNdU1UWTBMRFkyTWk0d01qaGhMak0yTkM0ek5qUXNNQ3d4TERBdExqTTJOQzB1TXpZMExqTTNMak0zTERBc01Dd3dMQzR6TmpRdU16WTBXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUUXhNUzQzTlRJZ0xUVTJPUzR4TXpFcEp5Qm1hV3hzUFNjbE1qTm1abVluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTmpnM0xqazJOQ3c0TkRjdU1USTRZUzR6TmpRdU16WTBMREFzTVN3d0xTNHpOalF0TGpNMk5DNHpOaTR6Tml3d0xEQXNNQ3d1TXpZMExqTTJORm9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMDFPVFV1TWpnMUlDMDNNamN1TWpnM0tTY2dabWxzYkQwbkpUSXpabVptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRZeU1TNHpOalFzT0RreExqY3hNMkV1TXpZdU16WXNNQ3d3TERBc0xqTTJOQzB1TXpZMExqTTBPQzR6TkRnc01Dd3dMREF0TGpNMk5DMHVNelE1TGpNMU55NHpOVGNzTUN3eExEQXNNQ3d1TnpFeldpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRVek9DNHpPQ0F0TnpZMUxqTTVOU2tuSUdacGJHdzlKeVV5TTJabVppY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMHhOemt1TWpZMExEWTRPUzR4TWpoaExqTTJOQzR6TmpRc01Dd3hMREF0TGpNMk5DMHVNelkwTGpNNExqTTRMREFzTUN3d0xDNHpOalF1TXpZMFdpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRFMk1DNDJNeklnTFRVNU1pNHlPRFlwSnlCbWFXeHNQU2NsTWpObVptWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5Oems1TGpFMk5DdzJOREl1TWpJNFlTNHpOalF1TXpZMExEQXNNU3d3TFM0ek5qUXRMak0yTkM0ek5pNHpOaXd3TERBc01Dd3VNelkwTGpNMk5Gb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MwMk9UQXVNams1SUMwMU5USXVNakV6S1NjZ1ptbHNiRDBuSlRJelptWm1KeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVEV3TWpndU56WTBMRGMwTlM0NU1qaGhMak0yTkM0ek5qUXNNQ3d4TERBdExqTTJOQzB1TXpZMExqTTNMak0zTERBc01Dd3dMQzR6TmpRdU16WTBXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUZzROaTQwTnpnZ0xUWTBNQzQ0TVRncEp5Qm1hV3hzUFNjbE1qTm1abVluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTVRJME15NDJOalFzTlRRekxqUXlPR0V1TXpZMExqTTJOQ3d3TERFc01DMHVNelkwTFM0ek5qUXVNell1TXpZc01Dd3dMREFzTGpNMk5DNHpOalJhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RNVEEzTUM0d09UY2dMVFEyTnk0M09UUXBKeUJtYVd4c1BTY2xNak5tWm1ZbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk1UUXdNUzQyTmpRc016UTRMak15T0dFdU16WTBMak0yTkN3d0xERXNNQzB1TXpZMExTNHpOalF1TXpjdU16Y3NNQ3d3TERBc0xqTTJOQzR6TmpSYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TVRJd05TNHdPVGdnTFRNd01TNHdPVE1wSnlCbWFXeHNQU2NsTWpObVptWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5NVE0yTWk0eE5qUXNNalUwTGpVeU9HRXVNelkwTGpNMk5Dd3dMREVzTUMwdU16WTBMUzR6TmpRdU16WXVNellzTUN3d0xEQXNMak0yTkM0ek5qUmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE1URTNNUzR6TkRnZ0xUSXlNQzQ1TkRjcEp5Qm1hV3hzUFNjbE1qTm1abVluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTVRRM015NDVORFFzTWpBekxqWXhNMkV1TXpVM0xqTTFOeXd3TERFc01Dd3dMUzQzTVRNdU16UTRMak0wT0N3d0xEQXNNQzB1TXpRNUxqTTJOQzR6TXpZdU16TTJMREFzTUN3d0xDNHpORGt1TXpRNVdpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRFeU5qWXVPRFk1SUMweE56Y3VORFUyS1NjZ1ptbHNiRDBuSlRJelptWm1KeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVEUxTlRJdU16WTBMREU1Tnk0M01qaGhMak0yTkM0ek5qUXNNQ3d4TERBdExqTTJOQzB1TXpZMExqTTJMak0yTERBc01Dd3dMQzR6TmpRdU16WTBXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xURXpNek11T0RZeUlDMHhOekl1TkRFMUtTY2dabWxzYkQwbkpUSXpabVptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRFME5UTXVNelkwTERFMU55NDNNamhoTGpNMk5DNHpOalFzTUN3eExEQXRMak0yTkMwdU16WTBMak0xTWk0ek5USXNNQ3d3TERBc0xqTTJOQzR6TmpSYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TVRJME9TNHlOek1nTFRFek9DNHlNemNwSnlCbWFXeHNQU2NsTWpObVptWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5NVE13TlM0ek5qUXNNemt1TnpJNFlTNHpOalF1TXpZMExEQXNNU3d3TFM0ek5qUXRMak0yTkM0ek55NHpOeXd3TERBc01Dd3VNelkwTGpNMk5Gb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MweE1USXlMamd4TmlBdE16Y3VOREV6S1NjZ1ptbHNiRDBuSlRJelptWm1KeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVEUyTnpNdU16WTBMRE01TGpjeU9HRXVNelkwTGpNMk5Dd3dMREVzTUMwdU16WTBMUzR6TmpRdU16Y3VNemNzTUN3d0xEQXNMak0yTkM0ek5qUmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE1UUXpOeTR5TkRrZ0xUTTNMalF4TXlrbklHWnBiR3c5SnlVeU0yWm1aaWNnWm1sc2JDMXlkV3hsUFNkbGRtVnViMlJrSnk4bE0wVWxNME53WVhSb0lHUTlKMDB4TmpZekxqUTJOQ3d5TWprdU9ESTRZUzR6TmpRdU16WTBMREFzTVN3d0xTNHpOalF0TGpNMk5DNHpOaTR6Tml3d0xEQXNNQ3d1TXpZMExqTTJORm9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMHhOREk0TGpjNUlDMHhPVGt1T0RReUtTY2dabWxzYkQwbkpUSXpabVptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRFMU16a3VPVFkwTERRM01TNDRNamhoTGpNMk5DNHpOalFzTUN3eExEQXRMak0yTkMwdU16WTBMak0yTGpNMkxEQXNNQ3d3TEM0ek5qUXVNelkwV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVEV6TWpNdU1qWTNJQzAwTURZdU5qRTJLU2NnWm1sc2JEMG5KVEl6Wm1abUp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRURTJOVEV1TURZMExEVTNPQzR3TWpoaExqTTJOQzR6TmpRc01Dd3hMREF0TGpNMk5DMHVNelkwTGpNM0xqTTNMREFzTUN3d0xDNHpOalF1TXpZMFdpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRFME1UZ3VNVGsxSUMwME9UY3VNelU0S1NjZ1ptbHNiRDBuSlRJelptWm1KeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVEUxT1RFdU9EWTBMRGMxTXk0ME1UTmhMak0yTGpNMkxEQXNNQ3d3TEM0ek5qUXRMak0yTkM0ek5EZ3VNelE0TERBc01Dd3dMUzR6TmpRdExqTTBPUzR6TlRjdU16VTNMREFzTVN3d0xEQXNMamN4TTFvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzB4TXpZM0xqWXhNaUF0TmpRM0xqSXlOaWtuSUdacGJHdzlKeVV5TTJabVppY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMHhNamN6TGpJMk5DdzNNemd1TlRJNFlTNHpOalF1TXpZMExEQXNNU3d3TFM0ek5qUXRMak0yTkM0ek5pNHpOaXd3TERBc01Dd3VNelkwTGpNMk5Gb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MweE1EazFMak00T0NBdE5qTTBMalE1TlNrbklHWnBiR3c5SnlVeU0yWm1aaWNnWm1sc2JDMXlkV3hsUFNkbGRtVnViMlJrSnk4bE0wVWxNME53WVhSb0lHUTlKMDB4TVRReUxqTTJOQ3c0TlRrdU5USTRZUzR6TmpRdU16WTBMREFzTVN3d0xTNHpOalF0TGpNMk5DNHpPQzR6T0N3d0xEQXNNQ3d1TXpZMExqTTJORm9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMDVPRE11TlRReUlDMDNNemN1T0RneUtTY2dabWxzYkQwbkpUSXpabVptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRFd01qWXVNelkwTERFeU15NDJNamhoTGpNME9DNHpORGdzTUN3d0xEQXNMak0wT1MwdU16WTBMak0xTnk0ek5UY3NNQ3d4TERBdExqTTBPUzR6TmpSYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0T0RnMExqUXlOeUF0TVRBNUxqRXdNU2tuSUdacGJHdzlKeVV5TTJabVppY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMHhNekl1TXpZMExEVXlMakF5T0dFdU16UTRMak0wT0N3d0xEQXNNQ3d1TXpRNUxTNHpOalF1TXpVM0xqTTFOeXd3TERFc01DMHVOekV6TERBc0xqTTNMak0zTERBc01Dd3dMQzR6TmpRdU16WTBXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xURXlNQzQxTlRrZ0xUUTNMamt5TXlrbklHWnBiR3c5SnlVeU0yWm1aaWNnWm1sc2JDMXlkV3hsUFNkbGRtVnViMlJrSnk4bE0wVWxNME53WVhSb0lHUTlKMDB4TkRVdU1pdzJNaTQwT1RSaExqVTVMalU1TERBc01Dd3dMQzQyTFM0MkxqWXVOaXd3TERBc01DMHVOaTB1Tmk0Mk1Ea3VOakE1TERBc01Dd3dMUzQyTGpZdU5pNDJMREFzTUN3d0xDNDJMalphSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RNVE14TGpNeU5TQXROVFl1TkRZM0tTY2dabWxzYkQwbkpUSXpabVptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRJM09TNDJMREk1TGpJNU5HRXVOaTQyTERBc01Dd3dMQzQyTFM0MkxqWXdPUzQyTURrc01Dd3dMREF0TGpZdExqWXVOaTQyTERBc01Dd3dMUzQyTGpZdU5Ua3VOVGtzTUN3d0xEQXNMall1TmxvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzB5TkRZdU1UWXhJQzB5T0M0eEtTY2dabWxzYkQwbkpUSXpabVptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRNeU9TdzNOaTR4T1RSaExqWXdPUzQyTURrc01Dd3dMREFzTGpZdExqWXVOaTQyTERBc01Dd3dMUzQyTFM0MkxqWXVOaXd3TERBc01Dd3dMREV1TVRrMFdpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRJNE9DNHpOekVnTFRZNExqRTNNeWtuSUdacGJHdzlKeVV5TTJabVppY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMDJOREV1TXl3MU1pNDNPVFJoTGpZdU5pd3dMREFzTUN3dU5pMHVOaTQxT1M0MU9Td3dMREFzTUMwdU5pMHVOaTQyTGpZc01Dd3dMREFzTUN3eExqRTVORm9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMDFOVFV1TWpFeUlDMDBPQzR4TnprcEp5Qm1hV3hzUFNjbE1qTm1abVluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTWpZMkxqUXNNemMxTGpNNU5HRXVOaTQyTERBc01Dd3dMQzQyTFM0MkxqWXdPUzQyTURrc01Dd3dMREF0TGpZdExqWXVOaTQyTERBc01Dd3dMUzQyTGpZdU5Ua3VOVGtzTUN3d0xEQXNMall1TmxvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzB5TXpRdU9EZ3pJQzB6TWpNdU9ESXhLU2NnWm1sc2JEMG5KVEl6Wm1abUp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRUVTNNaTQyTERjeE9DNDJPVFJoTGpZdU5pd3dMREFzTUN3dU5pMHVOaTQyTURrdU5qQTVMREFzTUN3d0xTNDJMUzQyTGpZdU5pd3dMREVzTUN3d0xERXVNVGswV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVFE1Tmk0MU1USWdMVFl4Tnk0eE5Ta25JR1pwYkd3OUp5VXlNMlptWmljZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBOd1lYUm9JR1E5SjAwMU5DdzROell1TmprMFlTNDJMallzTUN3eExEQXNNQzB4TGpFNU5DNDJNRGt1TmpBNUxEQXNNQ3d3TFM0MkxqWXVOaTQyTERBc01Dd3dMQzQyTGpaYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TlRNdU5DQXROelV5TGpFMU1pa25JR1pwYkd3OUp5VXlNMlptWmljZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBOd1lYUm9JR1E5SjAweE1EQXlMak1zT1RBNExqYzVOR0V1TlRrdU5Ua3NNQ3d3TERBc0xqWXRMall1Tmk0MkxEQXNNQ3d3TFM0MkxTNDJMall3T1M0Mk1Ea3NNQ3d3TERBdExqWXVOaTQxT1M0MU9Td3dMREFzTUN3dU5pNDJXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUZzJNeTQyTmpRZ0xUYzNPUzQxTnprcEp5Qm1hV3hzUFNjbE1qTm1abVluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTVRFNU1pNDVMRFEzTkM0eE9UUmhMall1Tml3d0xEQXNNQ3d1TmkwdU5pNDFPUzQxT1N3d0xEQXNNQzB1TmkwdU5pNDJMallzTUN3eExEQXNNQ3d4TGpFNU5Gb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MweE1ESTJMalV5SUMwME1EZ3VNalFwSnlCbWFXeHNQU2NsTWpObVptWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5NVFU0T0M0eExEWTNNeTQwT1RSaExqVTVMalU1TERBc01Dd3dMQzQyTFM0MkxqWXVOaXd3TERBc01DMHVOaTB1Tmk0Mk1Ea3VOakE1TERBc01Dd3dMUzQyTGpZdU5pNDJMREFzTUN3d0xDNDJMalphSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RNVE0yTkM0eE9UVWdMVFUzT0M0MU15a25JR1pwYkd3OUp5VXlNMlptWmljZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBOd1lYUm9JR1E5SjAwNU16VXVOQ3d5TWpBdU1EazBZUzQyTGpZc01Dd3dMREFzTGpZdExqWXVOVGt1TlRrc01Dd3dMREF0TGpZdExqWXVOaTQyTERBc01Dd3dMUzQyTGpZdU5Ua3VOVGtzTUN3d0xEQXNMall1TmxvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzA0TURZdU5UQXlJQzB4T1RFdU1USTNLU2NnWm1sc2JEMG5KVEl6Wm1abUp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRURTFPREl1Tml3Mk15NDBPVFJoTGpZd09TNDJNRGtzTUN3d0xEQXNMall0TGpZdU5pNDJMREFzTVN3d0xURXVNVGswTERBc0xqWXdPUzQyTURrc01Dd3dMREFzTGpZdU5sb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MweE16VTVMalE1TlNBdE5UY3VNekl5S1NjZ1ptbHNiRDBuSlRJelptWm1KeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVFkzT1M0eU5EY3NORFEyTGprNU5XRXVNalEzTGpJME55d3dMREVzTUMwdU1qUTNMUzR5TkRjdU1qUTFMakkwTlN3d0xEQXNNQ3d1TWpRM0xqSTBOMW9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMDFPRGN1T1RNM0lDMHpPRFV1TlRrM0tTY2dabWxzYkQwbkpUSXpabVptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRZM055NDFORGNzTVRZd0xqazVOV0V1TWpVMUxqSTFOU3d3TERBc01Dd3VNalEzTFM0eU5EY3VNalExTGpJME5Td3dMREFzTUMwdU1qUTNMUzR5TkRjdU1qUTNMakkwTnl3d0xERXNNQ3d3TEM0ME9UVmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE5UZzJMalE0TkNBdE1UUXhMakl5T0NrbklHWnBiR3c5SnlVeU0yWm1aaWNnWm1sc2JDMXlkV3hsUFNkbGRtVnViMlJrSnk4bE0wVWxNME53WVhSb0lHUTlKMDA1TmpVdU1qUTNMRFkxTGpVNU5XRXVNalUxTGpJMU5Td3dMREFzTUN3dU1qUTNMUzR5TkRjdU1qUTFMakkwTlN3d0xEQXNNQzB1TWpRM0xTNHlORGN1TWpNM0xqSXpOeXd3TERBc01DMHVNalEzTGpJME55NHlORFV1TWpRMUxEQXNNQ3d3TEM0eU5EY3VNalEzV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVGd6TWk0ek1EWWdMVFU1TGpjeE5Da25JR1pwYkd3OUp5VXlNMlptWmljZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBOd1lYUm9JR1E5SjAweE16RTFMamswT0N3eU9UY3VOamsxWVM0eU5EY3VNalEzTERBc01Td3dMUzR5TkRjdExqSTBOeTR5TXpjdU1qTTNMREFzTUN3d0xDNHlORGN1TWpRM1dpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRFeE16RXVPVFU0SUMweU5UZ3VNREk1S1NjZ1ptbHNiRDBuSlRJelptWm1KeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVEUxTmpVdU16UTRMREk1Tnk0Mk9UVmhMakkxTlM0eU5UVXNNQ3d3TERBc0xqSTBOeTB1TWpRM0xqSTBOUzR5TkRVc01Dd3dMREF0TGpJME55MHVNalEzTGpJMU5TNHlOVFVzTUN3d0xEQXRMakkwT0M0eU5EY3VNak0zTGpJek55d3dMREFzTUN3dU1qUTRMakkwTjFvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzB4TXpRMUxqQTFOU0F0TWpVNExqQXlPU2tuSUdacGJHdzlKeVV5TTJabVppY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMHhOakkzTGpBME9DdzFNVGN1TkRrMVlTNHlORGN1TWpRM0xEQXNNQ3d3TERBdExqUTVOUzR5TkRjdU1qUTNMREFzTVN3d0xEQXNMalE1TlZvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzB4TXprM0xqYzNOQ0F0TkRRMUxqZ3pOU2tuSUdacGJHdzlKeVV5TTJabVppY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMHhNRFF4TGpjME9DdzFNemN1TWprMVlTNHlORGN1TWpRM0xEQXNNQ3d3TERBdExqUTVOUzR5TkRjdU1qUTNMREFzTVN3d0xEQXNMalE1TlZvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzA0T1RjdU5qY3hJQzAwTmpJdU56VXpLU2NnWm1sc2JEMG5KVEl6Wm1abUp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRURXhNemd1TVRRM0xEY3lPUzQ0T1RWaExqSTBOeTR5TkRjc01Dd3hMREF0TGpJME55MHVNalEzTGpJME5TNHlORFVzTUN3d0xEQXNMakkwTnk0eU5EZGFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE9UZ3dMakF6T1NBdE5qSTNMak14T0NrbklHWnBiR3c5SnlVeU0yWm1aaWNnWm1sc2JDMXlkV3hsUFNkbGRtVnViMlJrSnk4bE0wVWxNME53WVhSb0lHUTlKMDAwTWpZdU9UUTNMRFF3Tmk0ek9UVmhMakkwTnk0eU5EY3NNQ3d4TERBc01DMHVORGsxTGpJMU5TNHlOVFVzTUN3d0xEQXRMakkwTnk0eU5EY3VNalExTGpJME5Td3dMREFzTUN3dU1qUTNMakkwTjFvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzB6TnpJdU16WXlJQzB6TlRBdU9UQTNLU2NnWm1sc2JEMG5KVEl6Wm1abUp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRUSTFOaTQwTkRjc01qRXpMakU1TldFdU1qUTNMakkwTnl3d0xERXNNQzB1TWpRM0xTNHlORGN1TWpRMUxqSTBOU3d3TERBc01Dd3VNalEzTGpJME4xb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MweU1qWXVOamdnTFRFNE5TNDRNamtwSnlCbWFXeHNQU2NsTWpObVptWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5NalV4TGpVME55d3pNemN1TWprMVlTNHlORGN1TWpRM0xEQXNNU3d3TFM0eU5EY3RMakkwTnk0eU5UVXVNalUxTERBc01Dd3dMQzR5TkRjdU1qUTNXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUSXlNaTQwT1RNZ0xUSTVNUzQ0TmpVcEp5Qm1hV3hzUFNjbE1qTm1abVluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTVRVM0xqYzBOeXcxTVRBdU1EazFZUzR5TkRjdU1qUTNMREFzTUN3d0xEQXRMalE1TlM0eU5EVXVNalExTERBc01Dd3dMUzR5TkRjdU1qUTNMakl6Tnk0eU16Y3NNQ3d3TERBc0xqSTBOeTR5TkRkYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TVRReUxqTTBOeUF0TkRNNUxqVXhNaWtuSUdacGJHdzlKeVV5TTJabVppY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMHlNVFF1TXpRM0xERTNOUzR4T1RWaExqSTBOUzR5TkRVc01Dd3dMREFzTGpJME55MHVNalEzTGpJME55NHlORGNzTUN3d0xEQXRMalE1TlN3d0xDNHlORFV1TWpRMUxEQXNNQ3d3TEM0eU5EY3VNalEzV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVEU1TUM0M01EZ2dMVEUxTXk0ek5qRXBKeUJtYVd4c1BTY2xNak5tWm1ZbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk16Y3dMakUwTERNeU1pNDBPVFZoTGpJMU5TNHlOVFVzTUN3d0xEQXNMakkwTnkwdU1qUTNMakkwTlM0eU5EVXNNQ3d3TERBdExqSTBOeTB1TWpRM0xqSTFOUzR5TlRVc01Dd3dMREF0TGpJME55NHlORGN1TWpNM0xqSXpOeXd3TERBc01Dd3VNalEzTGpJME4xb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0Mwek1qTXVPREl6SUMweU56a3VNaklwSnlCbWFXeHNQU2NsTWpObVptWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5NVGt5TGpZME55dzROekl1TmprMVlTNHlORGN1TWpRM0xEQXNNU3d3TFM0eU5EY3RMakkwTnk0eU5EVXVNalExTERBc01Dd3dMQzR5TkRjdU1qUTNXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xURTNNaTR4TmpjZ0xUYzBPUzR6TXpJcEp5Qm1hV3hzUFNjbE1qTm1abVluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTlRReUxqazBPQ3c1TXpjdU1qazFZUzR5TlRVdU1qVTFMREFzTUN3d0xDNHlORGN0TGpJME55NHlORFV1TWpRMUxEQXNNQ3d3TFM0eU5EY3RMakkwTnk0eU5UVXVNalUxTERBc01Dd3dMUzR5TkRjdU1qUTNMakkwTlM0eU5EVXNNQ3d3TERBc0xqSTBOeTR5TkRkYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TkRjeExqUTNOeUF0T0RBMExqVXlPU2tuSUdacGJHdzlKeVV5TTJabVppY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMHhOamt4TGpJME9DdzRPREV1T1RrMVlTNHlORGN1TWpRM0xEQXNNU3d3TFM0eU5EZ3RMakkwTnk0eU5UVXVNalUxTERBc01Dd3dMQzR5TkRndU1qUTNXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xURTBOVEl1TmpJNUlDMDNOVGN1TWpjNEtTY2dabWxzYkQwbkpUSXpabVptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRFek16RXVORFE0TERZME5DNHhPVFZoTGpJME55NHlORGNzTUN3d0xEQXNNQzB1TkRrMUxqSTBOeTR5TkRjc01Dd3dMREFzTUN3dU5EazFXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xURXhORFV1TWpBeUlDMDFOVFF1TURrektTY2dabWxzYkQwbkpUSXpabVptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UXk5bkpUTkZKVE5ETDNOMlp5VXpSVndpS1R0Y2JseDBZM1Z5YzI5eU9pQjFjbXdvSjJSaGRHRTZhVzFoWjJVdmMzWm5LM2h0YkR0MWRHWTRMRHh6ZG1jZ2VHMXNibk05WENKb2RIUndPaTh2ZDNkM0xuY3pMbTl5Wnk4eU1EQXdMM04yWjF3aUlIZHBaSFJvUFZ3aU5EQmNJaUJvWldsbmFIUTlYQ0kwTUZ3aUlIWnBaWGRDYjNnOVhDSXdJREFnTkRBZ05EQmNJajQ4WnlCMGNtRnVjMlp2Y20wOVhDSjBjbUZ1YzJ4aGRHVW9MVGcwTkNBdE5UQXdLVndpUGp4bklIUnlZVzV6Wm05eWJUMWNJblJ5WVc1emJHRjBaU2c0TkRRZ0xUVXlNQzR6TmlsY0lqNDhjR0YwYUNCa1BWd2lUVEU1TkM0M09EY3NNVEl4TWk0eU9XRXlMamcxT0N3eUxqZzFPQ3d3TERFc01Dd3lMamcxT0N3eUxqZzFPQ3d5TGpnMk9Td3lMamcyT1N3d0xEQXNNQzB5TGpnMU9DMHlMamcxT0ZwY0lpQjBjbUZ1YzJadmNtMDlYQ0owY21GdWMyeGhkR1VvTFRFM05DNDNPVElnTFRFM05DNDNPVE1wWENJZ1ptbHNiRDFjSWlVeU16ZzJPRFk0Tmx3aUx6NDhjR0YwYUNCa1BWd2lUVEl3T1M0ME1UWXNNVEl5T0M0ek5XRXhMalF5T1N3eExqUXlPU3d3TERFc01TMHhMalF5TkN3eExqUXlOQ3d4TGpReE9Td3hMalF4T1N3d0xEQXNNU3d4TGpReU5DMHhMalF5TkZwY0lpQjBjbUZ1YzJadmNtMDlYQ0owY21GdWMyeGhkR1VvTFRFNE9TNDBNakVnTFRFNE9TNDBNVGtwWENJZ1ptbHNiRDFjSWlVeU0yWm1OalUxWWx3aUx6NDhaeUIwY21GdWMyWnZjbTA5WENKMGNtRnVjMnhoZEdVb01DQXhNREl3TGpNMktWd2lQanh3WVhSb0lHUTlYQ0pOTWpFMkxqQXlOQ3d4TURJd0xqTTJkakV5TGpnMU5XZ3hMalF5TkZZeE1ESXdMak0yV2x3aUlIUnlZVzV6Wm05eWJUMWNJblJ5WVc1emJHRjBaU2d0TVRrMkxqY3pOaUF0TVRBeU1DNHpOaWxjSWlCbWFXeHNQVndpSlRJek9EWTROamcyWENJdlBqeHdZWFJvSUdROVhDSk5NakUyTGpBeU5Dd3hNekkwTGpJMmRqRXlMamcyTm1neExqUXlORll4TXpJMExqSTJXbHdpSUhSeVlXNXpabTl5YlQxY0luUnlZVzV6YkdGMFpTZ3RNVGsyTGpjek5pQXRNVEk1Tnk0eE1qWXBYQ0lnWm1sc2JEMWNJaVV5TXpnMk9EWTRObHdpTHo0OGNHRjBhQ0JrUFZ3aVRUTXdOQzR3TVRZc01USXpOaTR5TjNZeExqUXpOR2d4TWk0NE5UVjJMVEV1TkRNMFdsd2lJSFJ5WVc1elptOXliVDFjSW5SeVlXNXpiR0YwWlNndE1qYzJMamczTVNBdE1USXhOaTQ1T1RJcFhDSWdabWxzYkQxY0lpVXlNemcyT0RZNE5sd2lMejQ4Y0dGMGFDQmtQVndpVFRBc01USXpOaTR5TjNZeExqUXpORWd4TWk0NE5UVjJMVEV1TkRNMFdsd2lJSFJ5WVc1elptOXliVDFjSW5SeVlXNXpiR0YwWlNnd0lDMHhNakUyTGprNU1pbGNJaUJtYVd4c1BWd2lKVEl6T0RZNE5qZzJYQ0l2UGp3dlp6NDhaeUIwY21GdWMyWnZjbTA5WENKMGNtRnVjMnhoZEdVb09DNDROakVnTVRBeU9TNHlNVFlwWENJK1BIQmhkR2dnWkQxY0lrMHlORFF1TlN3eE1URTVMalUwT0dFdU56RTBMamN4TkN3d0xEQXNNQzB1TVRJc01TNDBNRGtzTVRBc01UQXNNQ3d3TERFc055NDBMRGN1TXpreExqY3hOUzQzTVRVc01Dd3dMREFzTVM0ek9URXRMak16ZGpCaE1URXVORE14TERFeExqUXpNU3d3TERBc01DMDRMalExTkMwNExqUTBNeTQzTVRndU56RTRMREFzTUN3d0xTNHlNVEl0TGpBeU0xcGNJaUIwY21GdWMyWnZjbTA5WENKMGNtRnVjMnhoZEdVb0xUSXpNQzQ1TVRnZ0xURXhNVGt1TlRRM0tWd2lJR1pwYkd3OVhDSWxNak00TmpnMk9EWmNJaTgrUEhCaGRHZ2daRDFjSWsweE1EY3VPVGN4TERFeE1Ua3VOVGc1WVM0M01qRXVOekl4TERBc01Dd3dMUzR4T1M0d01qTXNNVEV1TkRJNExERXhMalF5T0N3d0xEQXNNQzA0TGpRMExEZ3VOREkzTGpjeE5DNDNNVFFzTUN3d0xEQXNNUzR6TnprdU16WTVZekF0TGpBeExqQXdOUzB1TURJeExqQXdPQzB1TURNeFlURXdMREV3TERBc01Dd3hMRGN1TXpnMkxUY3VNemMzTGpjeE5DNDNNVFFzTUN3d0xEQXRMakUwTWkweExqUXdPVnBjSWlCMGNtRnVjMlp2Y20wOVhDSjBjbUZ1YzJ4aGRHVW9MVGs1TGpNeElDMHhNVEU1TGpVNE5pbGNJaUJtYVd4c1BWd2lKVEl6T0RZNE5qZzJYQ0l2UGp4d1lYUm9JR1E5WENKTk1qVXlMalF3Tnl3eE1qWTBMak16T0dFdU56RTBMamN4TkN3d0xEQXNNQzB1TnpFeUxqVTFOU3d4TUN3eE1Dd3dMREFzTVMwM0xqTTROaXczTGpNNExqY3hOQzQzTVRRc01Dd3dMREFzTGpJNE1pd3hMalJzTGpBMU15MHVNREV6WVRFeExqUXpMREV4TGpRekxEQXNNQ3d3TERndU5EUXRPQzQwTWprdU56RXpMamN4TXl3d0xEQXNNQzB1TmpjNExTNDRPVE5hWENJZ2RISmhibk5tYjNKdFBWd2lkSEpoYm5Oc1lYUmxLQzB5TXpBdU9ETTFJQzB4TWpVeExqUXhLVndpSUdacGJHdzlYQ0lsTWpNNE5qZzJPRFpjSWk4K1BIQmhkR2dnWkQxY0lrMDVPUzQ1TWpRc01USTJOQzR3TnpkaExqY3hOQzQzTVRRc01Dd3dMREF0TGpZMU5pNDRPU3d4TVM0ME16RXNNVEV1TkRNeExEQXNNQ3d3TERndU5EUXNPQzQwTlRRdU56RTFMamN4TlN3d0xEQXNNQ3d1TXpNMUxURXVNemxvTUdFNUxqazVOU3c1TGprNU5Td3dMREFzTVMwM0xqTTROaTAzTGpRdU56RTBMamN4TkN3d0xEQXNNQzB1TnpNMExTNDFOVGhvTUZwY0lpQjBjbUZ1YzJadmNtMDlYQ0owY21GdWMyeGhkR1VvTFRrNUxqSTBOaUF0TVRJMU1TNHhOeklwWENJZ1ptbHNiRDFjSWlVeU16ZzJPRFk0Tmx3aUx6NDhMMmMrUEdjZ2RISmhibk5tYjNKdFBWd2lkSEpoYm5Oc1lYUmxLRElnTVRBeU1pNHpOaWxjSWlCbWFXeHNQVndpYm05dVpWd2lJSE4wY205clpUMWNJaVV5TXpjd056QTNNRndpSUhOMGNtOXJaUzEzYVdSMGFEMWNJakpjSWo0OFkybHlZMnhsSUdONFBWd2lNVGhjSWlCamVUMWNJakU0WENJZ2NqMWNJakU0WENJZ2MzUnliMnRsUFZ3aWJtOXVaVndpTHo0OFkybHlZMnhsSUdONFBWd2lNVGhjSWlCamVUMWNJakU0WENJZ2NqMWNJakUzWENJZ1ptbHNiRDFjSW01dmJtVmNJaTgrUEM5blBqd3ZaejQ4TDJjK1BDOXpkbWMrSnlrZ01UWWdNVFlzSUdGMWRHODdYRzU5WEc1Y2JpNWhjM1JsY205cFpDQjdYRzVjZEhkcFpIUm9PalF3Y0hnN1hHNWNkR2hsYVdkb2REbzBNSEI0TzF4dVhIUmlZV05yWjNKdmRXNWtMV2x0WVdkbE9pQjFjbXdvWENKa1lYUmhPbWx0WVdkbEwzTjJaeXQ0Yld3c0pUTkRjM1puSUhodGJHNXpQU2RvZEhSd09pOHZkM2QzTG5jekxtOXlaeTh5TURBd0wzTjJaeWNnZDJsa2RHZzlKell3SnlCb1pXbG5hSFE5SnpZd0p5QjJhV1YzUW05NFBTY3dJREFnTmpBZ05qQW5KVE5GSlRORFp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d3SURBcEp5VXpSU1V6UTNCaGRHZ2daRDBuVFRJek1DNDVPVFFzTVRFdU56UXlMREl5TVM0NE5qY3NNakl1TkhZeVFURTBMalkzTVN3eE5DNDJOekVzTUN3d0xEQXNNak0yTGpNc01USXVNelkyTERJMUxqYzBNU3d5TlM0M05ERXNNQ3d3TERBc01qTXdMams1TkN3eE1TNDNOREphSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RNVGsxTGpnMk55QXRNVEF1TXpZMktTY2dabWxzYkQwbkpUSXpOR0U0WkdNMkp5OGxNMFVsTTBOd1lYUm9JR1E5SjAweE5EWXVNVGM1TERFeExqazROR3d1TURNMUxTNHlOamhoTXpFdU9UYzJMRE14TGprM05pd3dMREFzTUMweU1DNHpPREVzTnk0MExERTBMall6TlN3eE5DNDJNelVzTUN3d0xEQXNNVEV1TWpVMExEVXVNall5ZGkweVF6RTBNUzQxTml3eU1pNHpOelVzTVRRMUxqTTRNeXd4T0N3eE5EWXVNVGM1TERFeExqazRORm9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMHhNVEV1TURnNElDMHhNQzR6TkNrbklHWnBiR3c5SnlVeU16YzNZV0ZrTkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTWpReExqQTFPU3d5TkM0eU1qRkJNVEF1TmpZekxERXdMalkyTXl3d0xEQXNNQ3d5TXpNdU9TdzNMalEwTVdFeU1pNHhOamNzTWpJdU1UWTNMREFzTUN3d0xUZ3VORGN5TFRRdU9URXpZeTR3TVRFdExqQTFOeTR3TWpJdExqRXhOQzR3TXpNdExqRTNNV0V5TERJc01Dd3dMREF0TXk0NU16WXRMamN4TXl3eE1pNDJNakVzTVRJdU5qSXhMREFzTUN3eExURXVNelV6TERNdU9ESnNMVEV5TGpneExEVXhMamc0Tm1FeE1DNDJOak1zTVRBdU5qWXpMREFzTUN3d0xERTNMakUzT0MwMExqY3hPU3d6TlM0eE9EZ3NNelV1TVRnNExEQXNNQ3d3TERRdU5UYzJMVE11TXpNNUxEUXVOalkyTERRdU5qWTJMREFzTUN3d0xEVXVNaTAxTGpVd05rRXpNUzQ0TERNeExqZ3NNQ3d3TERBc01qUXhMakExT1N3eU5DNHlNakZhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RNVGd6TGpBMk5DQXdLU2NnWm1sc2JEMG5KVEl6WVRWak5tVXpKeThsTTBVbE0wTndZWFJvSUdROUowMDFNeTQ1TVRRc05qY3VPR011TlRJNExUWXVNalU1TFRFdU16Y3lMVEV4TGprdE5TNHpOVEV0TVRVdU9EYzFRVEU0TGpreE55d3hPQzQ1TVRjc01Dd3dMREFzTXpjdU1URXNORFl1TmpFNVlURXlMalkzTWl3eE1pNDJOeklzTUN3d0xERXRNakF1T0RNc01pNHdNallzTWl3eUxEQXNNU3d3TFRNdU1EWTRMREl1TlRZM2JDNHdNVFl1TURFNWNTMHVOalUzTGpZdE1TNHlPVE1zTVM0eU1qbGhNelV1TnpRMExETTFMamMwTkN3d0xEQXNNQzAwTGpFM055dzFMakF4TjBFeE1pNDJOeklzTVRJdU5qY3lMREFzTUN3d0xESXVNREV6TERjMkxqQXdPU3d5TXk0eExESXpMakVzTUN3d0xEQXNPQzQyTURnc09URXVPVEUyTERJekxqQTJOQ3d5TXk0d05qUXNNQ3d3TERBc01qUXVNeXc1T0M0MU1EVmhOVEV1TnpNNExEVXhMamN6T0N3d0xEQXNNQ3d5TUM0NU16WXRNVEl1TnpoQk1qa3VNRGN5TERJNUxqQTNNaXd3TERBc01DdzFNeTQ1TVRRc05qY3VPRm9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtEQWdMVFF4TGpFMU5pa25JR1pwYkd3OUp5VXlNMlF5WlRObU1TY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk1qWTNMak0zT0N3ek5qUXVNRGc1ZGpFekxqTXpNMkUyTGpZMk55dzJMalkyTnl3d0xEQXNNQ3d3TFRFekxqTXpNMW9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMHlNell1TURRMUlDMHpNakV1TkRJektTY2dabWxzYkQwbkpUSXpOR0U0WkdNMkp5OGxNMFVsTTBOd1lYUm9JR1E5SjAweU1Ua3VPREl4TERNM01DNDNOVFpqTUMwekxqWTRNaTB4TGpFNU5DMDJMalkyTnkweUxqWTJOeTAyTGpZMk4yRTJMalkyTnl3MkxqWTJOeXd3TERBc01Dd3dMREV6TGpNek0wTXlNVGd1TmpJNExETTNOeTQwTWpJc01qRTVMamd5TVN3ek56UXVORE00TERJeE9TNDRNakVzTXpjd0xqYzFObG9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMHhPRFV1T0RJeElDMHpNakV1TkRJektTY2dabWxzYkQwbkpUSXpOemRoWVdRMEp5OGxNMFVsTTBOd1lYUm9JR1E5SjAwME1qQXVPVGM0TERrMkxqY3hNWFl4TXk0ek16TmhOaTQyTmpjc05pNDJOamNzTUN3d0xEQXNNQzB4TXk0ek16TmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE16Y3hMalkwTlNBdE9EVXVNemM0S1NjZ1ptbHNiRDBuSlRJek5HRTRaR00ySnk4bE0wVWxNME53WVhSb0lHUTlKMDB6TnpNdU5ESXhMREV3TXk0ek56aGpNQzB6TGpZNE1pMHhMakU1TkMwMkxqWTJOeTB5TGpZMk55MDJMalkyTjJFMkxqWTJOeXcyTGpZMk55d3dMREVzTUN3d0xERXpMak16TTBNek56SXVNakk0TERFeE1DNHdORFFzTXpjekxqUXlNU3d4TURjdU1EWXNNemN6TGpReU1Td3hNRE11TXpjNFdpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRNeU1TNDBNakVnTFRnMUxqTTNPQ2tuSUdacGJHdzlKeVV5TXpjM1lXRmtOQ2N2SlRORkpUTkRaeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNneE5TNDJOamNnTWpVcEp5VXpSU1V6UTJOcGNtTnNaU0JqZUQwbk1TY2dZM2s5SnpFbklISTlKekVuSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtERXpMak16TXlBMEtTY2dabWxzYkQwbkpUSXpZVFZqTm1Vekp5OGxNMFVsTTBOamFYSmpiR1VnWTNnOUp6RW5JR041UFNjeEp5QnlQU2N4SnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3hOeTR6TXpNcEp5Qm1hV3hzUFNjbE1qTmhOV00yWlRNbkx5VXpSU1V6UTJOcGNtTnNaU0JqZUQwbk1TY2dZM2s5SnpFbklISTlKekVuSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtESTRJREV5TGpZMk55a25JR1pwYkd3OUp5VXlNMkUxWXpabE15Y3ZKVE5GSlRORFkybHlZMnhsSUdONFBTY3hKeUJqZVQwbk1TY2djajBuTVNjZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9NQ0F5TkM0Mk5qY3BKeUJtYVd4c1BTY2xNak5oTldNMlpUTW5MeVV6UlNVelF5OW5KVE5GSlRORGNHRjBhQ0JrUFNkTk1UQTRMakE0T1N3eE5qUXVPVGM0ZGpFM0xqTXpNMkU0TGpZMk55dzRMalkyTnl3d0xERXNNQ3d3TFRFM0xqTXpNMW9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMDVOUzQwTWpJZ0xURTBOUzQyTkRVcEp5Qm1hV3hzUFNjbE1qTTBZVGhrWXpZbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRRM0xqUTJOaXd4TnpNdU5qUTBZekF0TkM0M09EWXRNaTR3T0RrdE9DNDJOamN0TkM0Mk5qY3RPQzQyTmpkaE9DNDJOamNzT0M0Mk5qY3NNQ3d4TERBc01Dd3hOeTR6TXpORE5EVXVNemMzTERFNE1pNHpNU3cwTnk0ME5qWXNNVGM0TGpRekxEUTNMalEyTml3eE56TXVOalEwV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVE13TGpFek15QXRNVFExTGpZME5Da25JR1pwYkd3OUp5VXlNemMzWVdGa05DY3ZKVE5GSlROREwyY2xNMFVsTTBNdmMzWm5KVE5GWENJcE8xeHVYSFJpWVdOclozSnZkVzVrTFhOcGVtVTZZMjl1ZEdGcGJqdGNibHgwWW1GamEyZHliM1Z1WkMxeVpYQmxZWFE2Ym04dGNtVndaV0YwTzF4dWZWeHVMbk53WVdObGMyaHBjQ0I3WEc1Y2RIZHBaSFJvT2pNMmNIZzdYRzVjZEdobGFXZG9kRG8wTm5CNE8xeHVYSFJpWVdOclozSnZkVzVrTFdsdFlXZGxPaUIxY213b1hDSmtZWFJoT21sdFlXZGxMM04yWnl0NGJXd3NKVE5EYzNabklIaHRiRzV6UFNkb2RIUndPaTh2ZDNkM0xuY3pMbTl5Wnk4eU1EQXdMM04yWnljZ2QybGtkR2c5SnpJMkxqTTBNaWNnYUdWcFoyaDBQU2N6TmljZ2RtbGxkMEp2ZUQwbk1DQXdJREkyTGpNME1pQXpOaWNsTTBVbE0wTm5JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MweE1qTXVOVGd6SURBcEp5VXpSU1V6UTNCaGRHZ2daRDBuVFRFek5pNDNOVFVzTVRVd0xqQTJNMnd0TVRJdU5URXlMREV3TGpBeFlURXVOelUyTERFdU56VTJMREFzTUN3d0xTNDJOVGtzTVM0ek56RjJOQzQwTWpSc01UTXVNVGN4TFRJdU5qTTBMREV6TGpFM01Td3lMall6TkhZdE5DNDBNalJoTVM0M05UWXNNUzQzTlRZc01Dd3dMREF0TGpZMU9TMHhMak0zTVZvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzB3TGpBd01TQXRNVE0xTGpFek55a25JR1pwYkd3OUp5VXlNMlptTmpRMk5DY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk1qSXdMall4Tml3ek1UTXVNVE00YkMweExqQTBOQzAwTGpFM04yZ3ROaTQyTkd3dE1TNHdORFFzTkM0eE56ZGhMamczT0M0NE56Z3NNQ3d3TERBc0xqZzFNaXd4TGpBNU1XZzNMakF5TldFdU9EYzRMamczT0N3d0xEQXNNQ3d1T0RVeUxURXVNRGt4V2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVGM1TGpRNU9DQXRNamM0TGpJektTY2dabWxzYkQwbkpUSXpPVFU1WTJJekp5OGxNMFVsTTBOd1lYUm9JR1E5SjAweU1UUXVOVEl6TERNeE15NHhNemhzTVM0d05EUXROQzR4Tnpkb0xUSXVOak0wYkMweExqQTBOQ3cwTGpFM04yRXVPRGM0TGpnM09Dd3dMREFzTUN3dU9EVXlMREV1TURreGFESXVOak0wWVM0NE56Z3VPRGM0TERBc01Dd3hMUzQ0TlRJdE1TNHdPVEZhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3ROemt1TkRrNElDMHlOemd1TWpNcEp5Qm1hV3hzUFNjbE1qTTNNRGMwT0Rjbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRJd055NDFOamt1TkRJNUxESXdNeTQwT0N3M0xqY3pObUV6TGpVeE15d3pMalV4TXl3d0xEQXNNQzB1TkRRM0xERXVOekUxVmpNd0xqY3pNbUV4TGpjMU5pd3hMamMxTml3d0xEQXNNQ3d4TGpjMU5pd3hMamMxTm1nM0xqQXlOV0V4TGpjMU5pd3hMamMxTml3d0xEQXNNQ3d4TGpjMU5pMHhMamMxTmxZNUxqUTFZVE11TlRFeExETXVOVEV4TERBc01Dd3dMUzQwTkRjdE1TNDNNVFZNTWpBNUxqQXpOQzQwTWpsQkxqZ3pPUzQ0TXprc01Dd3dMREFzTWpBM0xqVTJPUzQwTWpsYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TnpFdU5UUTNJREFwSnlCbWFXeHNQU2NsTWpObE5HVmhaalluTHlVelJTVXpRM0JoZEdnZ1pEMG5UVEl3Tmk0MU5EVXNNekF1TnpneFZqa3VOV0UzTGpZMU9DdzNMalkxT0N3d0xEQXNNU3d1TVRnMkxURXVOekUxYkRFdU55MDNMak13TjJFeExqRXhNU3d4TGpFeE1Td3dMREFzTVN3dU1UVTNMUzR6TnpFdU9ETXpMamd6TXl3d0xEQXNNQzB4TGpBeU15NHpOekZNTWpBekxqUTRMRGN1TnpnMVlUTXVOVEV6TERNdU5URXpMREFzTUN3d0xTNDBORGNzTVM0M01UVldNekF1TnpneFlURXVOelUyTERFdU56VTJMREFzTUN3d0xERXVOelUyTERFdU56VTJhREl1TkRnNFF6SXdOaTQ0TnpNc016SXVOVE0zTERJd05pNDFORFVzTXpFdU56VXhMREl3Tmk0MU5EVXNNekF1TnpneFdpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRjeExqVTBOeUF0TUM0d05Ea3BKeUJtYVd4c1BTY2xNak5qTjJObVpUSW5MeVV6UlNVelEzQmhkR2dnWkQwblRUSXdPUzR3TXpVdU5ETmhMamd6T1M0NE16a3NNQ3d3TERBdE1TNDBOalFzTUd3dE5DNHdPRGtzTnk0ek1EZGhNeTQxTVRNc015NDFNVE1zTUN3d0xEQXRMalEwTnl3eExqY3hOWFkwTGpab01UQXVOVE0zZGkwMExqWmhNeTQxTVRFc015NDFNVEVzTUN3d0xEQXRMalEwTnkweExqY3hOVm9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMDNNUzQxTkRnZ0xUQXVNREF4S1NjZ1ptbHNiRDBuSlRJelptWTJORFkwSnk4bE0wVWxNME53WVhSb0lHUTlKMDB5TURZdU5UUTJMRGt1TlRFeVlUY3VOalU0TERjdU5qVTRMREFzTUN3eExDNHhPRFl0TVM0M01UVnNNUzQzTFRjdU16QTNZVEV1TVRFeExERXVNVEV4TERBc01Dd3hMQzR4TlRjdExqTTNNUzQ0Tmk0NE5pd3dMREFzTUMwdU5UVXpMUzR3TVRKakxTNHdNVE1zTUMwdU1ESTJMakF4TVMwdU1ETTVMakF4Tm1FdU9ERXlMamd4TWl3d0xEQXNNQzB1TVRrekxqRXdObU10TGpBeE9TNHdNVFF0TGpBek9DNHdNamN0TGpBMU5pNHdORE5oTGpneU1TNDRNakVzTUN3d0xEQXRMakU0TWk0eU1UaE1NakF6TGpRNE1TdzNMamhoTXk0MU1UTXNNeTQxTVRNc01Dd3dMREF0TGpRME55d3hMamN4TlhZMExqWm9NeTQxTVRKYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TnpFdU5UUTRJQzB3TGpBMk1Ta25JR1pwYkd3OUp5VXlNMlF5TlRVMVlTY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk1qRXpMalUzTVN3eE5ERXVNak0xU0RJd015NHdNelIyTVM0M05UWm9NaTR5TlRKaE15NDBOamtzTXk0ME5qa3NNQ3d3TERBc05pNHdNelFzTUdneUxqSTFNbll0TVM0M05UWmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE56RXVOVFE0SUMweE1qY3VNVGczS1NjZ1ptbHNiRDBuSlRJell6ZGpabVV5Snk4bE0wVWxNME5qYVhKamJHVWdZM2c5SnpFdU56VTJKeUJqZVQwbk1TNDNOVFluSUhJOUp6RXVOelUySnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3hNelF1T1RrNUlERXlMakk1TWlrbklHWnBiR3c5SnlVeU16VmlOV1EyWlNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTWpBMkxqVTBOaXd4TkRRdU1qWTJkaTB6TGpBek1tZ3RNeTQxTVRKMk1TNDNOVFpvTWk0eU5USkJNeTQxTlRFc015NDFOVEVzTUN3d0xEQXNNakEyTGpVME5pd3hORFF1TWpZMldpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRjeExqVTBPQ0F0TVRJM0xqRTROaWtuSUdacGJHdzlKeVV5TTJGbVlqbGtNaWN2SlRORkpUTkRjR0YwYUNCa1BTZE5NakU1TGpZM055NDBNamxzTFRNdU1pdzFMamN4Tm1nM0xqZzJNMnd0TXk0eUxUVXVOekUyUVM0NE16a3VPRE01TERBc01Dd3dMREl4T1M0Mk56Y3VOREk1V2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVGd6TGpZMU5TQXdLU2NnWm1sc2JEMG5KVEl6TnpBM05EZzNKeThsTTBVbE0wTndZWFJvSUdROUowMHlNVGt1TWpFeExEWXVNakEyTERJeU1DNDFORFF1TkRnNVFURXVNVEV4TERFdU1URXhMREFzTUN3eExESXlNQzQzTGpFeE9HRXVPRFl1T0RZc01Dd3dMREF0TGpVMU15MHVNREV5YkMwdU1ERXhMREF0TGpBeU9DNHdNVEZoTGpneE1pNDRNVElzTUN3d0xEQXRMakU1TXk0eE1EWnNMUzR3TWk0d01UVmpMUzR3TVRJdU1EQTVMUzR3TWpVdU1ERTRMUzR3TXpjdU1ESTRZUzQ0TWpNdU9ESXpMREFzTUN3d0xTNHhPREl1TWpFNGJDMHpMaklzTlM0M01UWm9NaTQzTXpKYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0T0RNdU5qVTJJQzB3TGpBMktTY2dabWxzYkQwbkpUSXpOV0kxWkRabEp5OGxNMFVsTTBObklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLREV5TXk0MU9ETWdNalV1TkRZektTY2xNMFVsTTBOd1lYUm9JR1E5SjAweE1qTXVOVGcwTERJMk1TNHlOalJzTnk0NUxURXVOVGd4VmpJMU5td3ROeTQ1TERJdU1UQTNXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xURXlNeTQxT0RRZ0xUSTFOUzQ1T1RZcEp5Qm1hV3hzUFNjbE1qTmtNalUxTldFbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRNeE5pNDROeXd5TmpFdU1qWTBiQzAzTGprdE1TNDFPREZXTWpVMmJEY3VPU3d5TGpFd04xb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MweU9UQXVOVEkzSUMweU5UVXVPVGsyS1NjZ1ptbHNiRDBuSlRJelpESTFOVFZoSnk4bE0wVWxNME12WnlVelJTVXpRMmNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb01USXpMalU0TXlBeU5TNDBOak1wSnlVelJTVXpRM0JoZEdnZ1pEMG5UVEV5TkM0ME5qSXNNalkwTGpneU5HZ3dZUzQ0TnpndU9EYzRMREFzTUN3d0xTNDROemd1T0RjNGRqY3VNREkxWVM0NE56Z3VPRGM0TERBc01Dd3dMQzQ0TnpndU9EYzRhREJoTGpnM09DNDROemdzTUN3d0xEQXNMamczT0MwdU9EYzRWakkyTlM0M1FTNDROemd1T0RjNExEQXNNQ3d3TERFeU5DNDBOaklzTWpZMExqZ3lORm9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMHhNak11TlRnMElDMHlOak11T1RRMktTY2dabWxzYkQwbkpUSXpZV1ppT1dReUp5OGxNMFVsTTBOd1lYUm9JR1E5SjAweE5Ua3VOemN6TERJMU5tZ3dZUzQ0TnpndU9EYzRMREFzTUN3d0xTNDROemd1T0RjNGRqUXVNemxoTGpnM09DNDROemdzTUN3d0xEQXNMamczT0M0NE56aG9NR0V1T0RjNExqZzNPQ3d3TERBc01Dd3VPRGM0TFM0NE56aDJMVFF1TXpsQkxqZzNPQzQ0Tnpnc01Dd3dMREFzTVRVNUxqYzNNeXd5TlRaYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TVRVMUxqTTRNeUF0TWpVMUxqazVOaWtuSUdacGJHdzlKeVV5TTJGbVlqbGtNaWN2SlRORkpUTkRjR0YwYUNCa1BTZE5NemN4TGpZek9Td3lOalF1T0RJMGFEQmhMamczT0M0NE56Z3NNQ3d3TERFc0xqZzNPQzQ0TnpoMk55NHdNalZoTGpnM09DNDROemdzTUN3d0xERXRMamczT0M0NE56aG9NR0V1T0RjNExqZzNPQ3d3TERBc01TMHVPRGM0TFM0NE56aFdNalkxTGpkQkxqZzNPQzQ0Tnpnc01Dd3dMREVzTXpjeExqWXpPU3d5TmpRdU9ESTBXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUTTBOaTR4TnpVZ0xUSTJNeTQ1TkRZcEp5Qm1hV3hzUFNjbE1qTmhabUk1WkRJbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRNek5pNHpNamdzTWpVMmFEQmhMamczT0M0NE56Z3NNQ3d3TERFc0xqZzNPQzQ0TnpoMk5DNHpPV0V1T0RjNExqZzNPQ3d3TERBc01TMHVPRGM0TGpnM09HZ3dZUzQ0TnpndU9EYzRMREFzTUN3eExTNDROemd0TGpnM09IWXROQzR6T1VFdU9EYzRMamczT0N3d0xEQXNNU3d6TXpZdU16STRMREkxTmxvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzB6TVRRdU16YzJJQzB5TlRVdU9UazJLU2NnWm1sc2JEMG5KVEl6WVdaaU9XUXlKeThsTTBVbE0wTXZaeVV6UlNVelEyY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTVRJekxqVTRNeUF5TlM0ME5EWXBKeVV6UlNVelEyTnBjbU5zWlNCamVEMG5NQzQ0T1RVbklHTjVQU2N3TGpnNU5TY2djajBuTUM0NE9UVW5JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0RBZ01DNDROaklwSnlCbWFXeHNQU2NsTWpNNU5UbGpZak1uTHlVelJTVXpRMk5wY21Oc1pTQmplRDBuTUM0NE9UVW5JR041UFNjd0xqZzVOU2NnY2owbk1DNDRPVFVuSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtETXVORGsyS1NjZ1ptbHNiRDBuSlRJek9UVTVZMkl6Snk4bE0wVWxNME5qYVhKamJHVWdZM2c5SnpBdU9EazFKeUJqZVQwbk1DNDRPVFVuSUhJOUp6QXVPRGsxSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3lOQzQxTlRJZ01DNDROaklwSnlCbWFXeHNQU2NsTWpNNU5UbGpZak1uTHlVelJTVXpRMk5wY21Oc1pTQmplRDBuTUM0NE9UVW5JR041UFNjd0xqZzVOU2NnY2owbk1DNDRPVFVuSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtESXhMakExTnlrbklHWnBiR3c5SnlVeU16azFPV05pTXljdkpUTkZKVE5ETDJjbE0wVWxNME5uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtERXpOUzQ0TnpZZ01qTXVOekEzS1NjbE0wVWxNME53WVhSb0lHUTlKMDB5TkRndU1EVXNNalF6TGpZd09HZ3dZUzQ0TnpndU9EYzRMREFzTUN3d0xDNDROemd0TGpnM09IWXRNeTQxTVRKaExqZzNPQzQ0Tnpnc01Dd3dMREF0TGpnM09DMHVPRGM0YURCaExqZzNPQzQ0Tnpnc01Dd3dMREF0TGpnM09DNDROemgyTXk0MU1USkJMamczT0M0NE56Z3NNQ3d3TERBc01qUTRMakExTERJME15NDJNRGhhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RNalEzTGpFM01pQXRNak00TGpNMEtTY2dabWxzYkQwbkpUSXpZemRqWm1VeUp5OGxNMFVsTTBOd1lYUm9JR1E5SjAweU56UXVOVE0wTERJME15NDJNRGhvTUdFdU9EYzRMamczT0N3d0xEQXNNQ3d1T0RjNExTNDROemgyTFRNdU5URXlZUzQ0TnpndU9EYzRMREFzTUN3d0xTNDROemd0TGpnM09HZ3dZUzQ0TnpndU9EYzRMREFzTUN3d0xTNDROemd1T0RjNGRqTXVOVEV5UVM0NE56Z3VPRGM0TERBc01Dd3dMREkzTkM0MU16UXNNalF6TGpZd09Gb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MweU56RXVNREl5SUMweU16Z3VNelFwSnlCbWFXeHNQU2NsTWpOak4yTm1aVEluTHlVelJTVXpReTluSlRORkpUTkRjR0YwYUNCa1BTZE5Nakl4TGpVMk55d3lORE11TmpBNGFEQmhMamczT0M0NE56Z3NNQ3d3TERBc0xqZzNPQzB1T0RjNGRpMHpMalV4TW1FdU9EYzRMamczT0N3d0xEQXNNQzB1T0RjNExTNDROemhvTUdFdU9EYzRMamczT0N3d0xEQXNNQzB1T0RjNExqZzNPSFl6TGpVeE1rRXVPRGM0TGpnM09Dd3dMREFzTUN3eU1qRXVOVFkzTERJME15NDJNRGhhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RPRGN1TkRRM0lDMHlNVFF1TmpNektTY2dabWxzYkQwbkpUSXpZV1ppT1dReUp5OGxNMFVsTTBNdlp5VXpSU1V6UXk5emRtY2xNMFZjSWlrN1hHNWNkR0poWTJ0bmNtOTFibVF0YzJsNlpUcGpiMjUwWVdsdU8xeHVYSFJpWVdOclozSnZkVzVrTFhKbGNHVmhkRHB1YnkxeVpYQmxZWFE3WEc1OVhHNWNiaTVoYzNSbGNtOXBaQzVoWTNScGRtVWdlMXh1WEhSM2FXUjBhRG8yTUhCNE8xeHVYSFJvWldsbmFIUTZOakJ3ZUR0Y2JseDBZbUZqYTJkeWIzVnVaQzFwYldGblpUb2dkWEpzS0Z3aVpHRjBZVHBwYldGblpTOXpkbWNyZUcxc0xDVXpRM04yWnlCNGJXeHVjejBuYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNuSUhkcFpIUm9QU2MyTlNjZ2FHVnBaMmgwUFNjMk5DY2dkbWxsZDBKdmVEMG5NQ0F3SURZMUlEWTBKeVV6UlNVelEyY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRFd01ETWdMVFE1TUNrbkpUTkZKVE5EWTJseVkyeGxJR040UFNjeU15NDFKeUJqZVQwbk1qTXVOU2NnY2owbk1qTXVOU2NnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb01UQXdPU0ExTURJcEp5Qm1hV3hzUFNjbE1qTmtNbVV6WmpFbkx5VXpSU1V6UTJOcGNtTnNaU0JqZUQwbk9TY2dZM2s5SnprbklISTlKemtuSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtERXdNRGtnTlRBeUtTY2dabWxzYkQwbkpUSXpaREpsTTJZeEp5OGxNMFVsTTBOamFYSmpiR1VnWTNnOUp6RXlKeUJqZVQwbk1USW5JSEk5SnpFeUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d4TURJeElEUTVNQ2tuSUdacGJHdzlKeVV5TTJReVpUTm1NU2N2SlRORkpUTkRZMmx5WTJ4bElHTjRQU2N4TWljZ1kzazlKekV5SnlCeVBTY3hNaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb01UQXpNeUEwT1RrcEp5Qm1hV3hzUFNjbE1qTmtNbVV6WmpFbkx5VXpSU1V6UTJOcGNtTnNaU0JqZUQwbk1USW5JR041UFNjeE1pY2djajBuTVRJbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLREV3TURNZ05USXdLU2NnWm1sc2JEMG5KVEl6WkRKbE0yWXhKeThsTTBVbE0wTmphWEpqYkdVZ1kzZzlKekV5SnlCamVUMG5NVEluSUhJOUp6RXlKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNneE1ETXpJRFV6TUNrbklHWnBiR3c5SnlVeU0yUXlaVE5tTVNjdkpUTkZKVE5EWTJseVkyeGxJR040UFNjM0xqVW5JR041UFNjM0xqVW5JSEk5SnpjdU5TY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTVRBME9DQTFNak1wSnlCbWFXeHNQU2NsTWpOa01tVXpaakVuTHlVelJTVXpRMk5wY21Oc1pTQmplRDBuTnk0MUp5QmplVDBuTnk0MUp5QnlQU2MzTGpVbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLREV3TVRBZ05USXpLU2NnWm1sc2JEMG5KVEl6TkdFNFpHTTJKeThsTTBVbE0wTmphWEpqYkdVZ1kzZzlKemN1TlNjZ1kzazlKemN1TlNjZ2NqMG5OeTQxSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3hNREUxSURVeE5Da25JR1pwYkd3OUp5VXlNelJoT0dSak5pY3ZKVE5GSlRORFkybHlZMnhsSUdONFBTY3hPQ2NnWTNrOUp6RTRKeUJ5UFNjeE9DY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTVRBeE9DQTFNRFFwSnlCbWFXeHNQU2NsTWpNMFlUaGtZelluTHlVelJTVXpRMk5wY21Oc1pTQmplRDBuTnk0MUp5QmplVDBuTnk0MUp5QnlQU2MzTGpVbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLREV3TVRBZ05USXpLU2NnWm1sc2JEMG5KVEl6TkdFNFpHTTJKeThsTTBVbE0wTmphWEpqYkdVZ1kzZzlKelF1TlNjZ1kzazlKelF1TlNjZ2NqMG5OQzQxSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3hNRFU1SURVeE15a25JR1pwYkd3OUp5VXlNMlF5WlRObU1TY3ZKVE5GSlRORFkybHlZMnhsSUdONFBTYzNMalVuSUdONVBTYzNMalVuSUhJOUp6Y3VOU2NnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb01UQXpOaUExTXpNcEp5Qm1hV3hzUFNjbE1qTTBZVGhrWXpZbkx5VXpSU1V6UTJOcGNtTnNaU0JqZUQwbk55NDFKeUJqZVQwbk55NDFKeUJ5UFNjM0xqVW5JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0RFd01qY2dORGs1S1NjZ1ptbHNiRDBuSlRJek5HRTRaR00ySnk4bE0wVWxNME5qYVhKamJHVWdZM2c5SnpjdU5TY2dZM2s5SnpjdU5TY2djajBuTnk0MUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d4TURJd0lEVXhPQ2tuSUdacGJHdzlKeVV5TXpjM1lXRmtOQ2N2SlRORkpUTkRZMmx5WTJ4bElHTjRQU2MzTGpVbklHTjVQU2MzTGpVbklISTlKemN1TlNjZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9NVEF6TXlBMU1EY3BKeUJtYVd4c1BTY2xNak0zTjJGaFpEUW5MeVV6UlNVelEyTnBjbU5zWlNCamVEMG5OUzQxSnlCamVUMG5OUzQxSnlCeVBTYzFMalVuSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtERXdNemNnTlRJM0tTY2dabWxzYkQwbkpUSXpOemRoWVdRMEp5OGxNMFVsTTBOamFYSmpiR1VnWTNnOUp6UW5JR041UFNjMEp5QnlQU2MwSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3hNRE0zSURVeU55a25JR1pwYkd3OUp5VXlNMlptWmljdkpUTkZKVE5EWTJseVkyeGxJR040UFNjMEp5QmplVDBuTkNjZ2NqMG5OQ2NnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb01UQXlOaUExTWpBcEp5Qm1hV3hzUFNjbE1qTm1abVluTHlVelJTVXpRMk5wY21Oc1pTQmplRDBuTkNjZ1kzazlKelFuSUhJOUp6UW5JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0RFd05EQWdOVEV4S1NjZ1ptbHNiRDBuSlRJelptWm1KeThsTTBVbE0wTXZaeVV6UlNVelF5OXpkbWNsTTBWY0lpazdYRzVjZEdKaFkydG5jbTkxYm1RdGMybDZaVHBqYjI1MFlXbHVPMXh1WEhSaVlXTnJaM0p2ZFc1a0xYSmxjR1ZoZERwdWJ5MXlaWEJsWVhRN1hHNTlYRzRpWFgwPSAqLzwvc3R5bGU+Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQThaUSxpQkFBaUIsQUFBRSxDQUFDLEFBQzNCLFVBQVUsQ0FBRSxJQUFJLENBQ2hCLE9BQU8sQ0FBRSxHQUFHLEFBQ2IsQ0FBQyxBQUVPLHlCQUF5QixBQUFFLENBQUMsQUFDbkMsVUFBVSxDQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxBQUNoRCxDQUFDLEFBUU8sY0FBYyxBQUFFLENBQUMsQUFDeEIsYUFBYSxDQUFFLEdBQUcsQ0FDbEIsT0FBTyxDQUFFLEdBQUcsQ0FDWixNQUFNLENBQUUsR0FBRyxDQUNYLFNBQVMsQ0FBRSxJQUFJLEFBQ2hCLENBQUMsQUFFTyx5QkFBeUIs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 */";
    	append(document.head, style);
    }

    // (39:3) {#if open}
    function create_if_block(ctx) {
    	var div, current;

    	var asteroids = new Asteroids({ $$inline: true });
    	asteroids.$on("complete", ctx.callbackFunction);

    	return {
    		c: function create() {
    			div = element("div");
    			asteroids.$$.fragment.c();
    			div.id = "JSE-captcha-game";
    			add_location(div, file$1, 39, 4, 3149);
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
    	var section, details, summary, div0, input, t0, div1, p, t1, div2, svg, g5, path0, path1, path2, g0, path3, g2, g1, path4, g4, g3, path5, t2, div4, div3, section_class_value, current, dispose;

    	var if_block = (ctx.open) && create_if_block(ctx);

    	return {
    		c: function create() {
    			section = element("section");
    			details = element("details");
    			summary = element("summary");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			div1 = element("div");
    			p = element("p");
    			t1 = space();
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
    			t2 = space();
    			div4 = element("div");
    			div3 = element("div");
    			if (if_block) if_block.c();
    			input.id = "captchaCheck";
    			attr(input, "type", "checkbox");
    			add_location(input, file$1, 19, 4, 531);
    			div0.id = "JSE-input";
    			add_location(div0, file$1, 18, 3, 506);
    			add_location(p, file$1, 25, 4, 696);
    			div1.id = "JSE-msg";
    			add_location(div1, file$1, 24, 3, 673);
    			attr(path0, "d", "M55.84,406.929,55.8,418.9a7.144,7.144,0,0,0,3.536,6.128l10.471,6a7.15,7.15,0,0,0,7.007.016l10.543-6.087a7.039,7.039,0,0,0,3.528-6.1l.04-11.972a7.143,7.143,0,0,0-3.536-6.127l-10.471-6a7.15,7.15,0,0,0-7.007-.016l-10.543,6.079A7.043,7.043,0,0,0,55.84,406.929Zm17.519-6.943,11.189,6.523-.008,12.844L73.407,425.78l-11.133-6.418-.057-12.949Z");
    			attr(path0, "transform", "translate(-55.8 -362.045)");
    			attr(path0, "fill", "#51bfec");
    			add_location(path0, file$1, 30, 119, 877);
    			attr(path1, "d", "M509.74,407.229,509.7,419.2a7.144,7.144,0,0,0,3.536,6.128l10.471,6a7.15,7.15,0,0,0,7.008.016l10.543-6.087a7.039,7.039,0,0,0,3.528-6.1l.04-11.972a7.144,7.144,0,0,0-3.536-6.128l-10.471-6a7.15,7.15,0,0,0-7.007-.016l-10.544,6.087A7.063,7.063,0,0,0,509.74,407.229Zm17.519-6.935,11.189,6.523-.008,12.844-11.133,6.426-11.125-6.418-.057-12.949Z");
    			attr(path1, "transform", "translate(-473.056 -362.321)");
    			attr(path1, "fill", "#51bfec");
    			add_location(path1, file$1, 30, 519, 1277);
    			attr(path2, "d", "M282.54,13.129,282.5,25.1a7.144,7.144,0,0,0,3.536,6.127l10.471,6a7.15,7.15,0,0,0,7.007.016l10.543-6.087a7.039,7.039,0,0,0,3.528-6.1l.04-11.972a7.144,7.144,0,0,0-3.536-6.127l-10.471-6a7.15,7.15,0,0,0-7.007-.016L286.068,7.034A7.03,7.03,0,0,0,282.54,13.129Zm17.511-6.935,11.189,6.515-.008,12.844L300.1,31.98l-11.125-6.418-.056-12.941Z");
    			attr(path2, "transform", "translate(-264.198 -0.037)");
    			attr(path2, "fill", "#51bfec");
    			add_location(path2, file$1, 30, 923, 1681);
    			attr(path3, "d", "M411,817.273a26.851,26.851,0,0,1-13.781-.008,1.214,1.214,0,0,0-.646,2.341,29.5,29.5,0,0,0,15.064.008,1.239,1.239,0,0,0,.848-1.494,1.226,1.226,0,0,0-1.485-.848Z");
    			attr(path3, "transform", "translate(-395.688 -817.227)");
    			attr(path3, "fill", "#51bfec");
    			add_location(path3, file$1, 30, 1359, 2117);
    			attr(g0, "transform", "translate(27.44 65.973)");
    			add_location(g0, file$1, 30, 1320, 2078);
    			attr(path4, "d", "M154.1,254.1a26.8,26.8,0,0,1,6.9-11.948,1.21,1.21,0,1,0-1.712-1.712,29.257,29.257,0,0,0-7.524,13.014,1.21,1.21,0,1,0,2.333.646Z");
    			attr(path4, "transform", "translate(-151.727 -240.087)");
    			attr(path4, "fill", "#51bfec");
    			add_location(path4, file$1, 30, 1656, 2414);
    			attr(g1, "transform", "translate(0)");
    			add_location(g1, file$1, 30, 1628, 2386);
    			attr(g2, "transform", "translate(7.744 19.38)");
    			add_location(g2, file$1, 30, 1590, 2348);
    			attr(path5, "d", "M729.4,241.99a26.72,26.72,0,0,1,6.9,11.948,1.214,1.214,0,1,0,2.341-.646,29.3,29.3,0,0,0-7.532-13.022,1.213,1.213,0,0,0-1.711,1.72Z");
    			attr(path5, "transform", "translate(-729.05 -239.925)");
    			attr(path5, "fill", "#51bfec");
    			add_location(path5, file$1, 30, 1927, 2685);
    			attr(g3, "transform", "translate(0)");
    			add_location(g3, file$1, 30, 1899, 2657);
    			attr(g4, "transform", "translate(54.352 19.366)");
    			add_location(g4, file$1, 30, 1859, 2617);
    			attr(g5, "transform", "translate(0)");
    			add_location(g5, file$1, 30, 91, 849);
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "viewBox", "0 0 71.771 69.931");
    			add_location(svg, file$1, 30, 23, 781);
    			div2.id = "JSE-brand";
    			add_location(div2, file$1, 30, 3, 761);
    			add_location(summary, file$1, 16, 2, 462);
    			div3.id = "JSE-captcha-game-container";
    			add_location(div3, file$1, 37, 3, 3028);
    			div4.id = "JSE-CaptchaDisplay";
    			add_location(div4, file$1, 36, 2, 2995);
    			details.className = "captchaPanel";
    			details.open = true;
    			add_location(details, file$1, 14, 1, 389);
    			section.id = "JSE-Captcha";
    			section.className = section_class_value = "" + ctx.theme + " " + ctx.size;
    			toggle_class(section, "active", ctx.showCaptcha);
    			toggle_class(section, "success", ctx.complete);
    			toggle_class(section, "thinking", ctx.thinking);
    			add_location(section, file$1, 13, 0, 254);

    			dispose = [
    				listen(input, "change", ctx.input_change_handler),
    				listen(div3, "mousemove", ctx.handleMovement),
    				listen(div3, "touchmove", ctx.handleMovement),
    				listen(details, "toggle", ctx.details_toggle_handler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, section, anchor);
    			append(section, details);
    			append(details, summary);
    			append(summary, div0);
    			append(div0, input);

    			input.checked = ctx.captchaCheck;

    			append(summary, t0);
    			append(summary, div1);
    			append(div1, p);
    			append(summary, t1);
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
    			append(details, t2);
    			append(details, div4);
    			append(div4, div3);
    			if (if_block) if_block.m(div3, null);

    			details.open = ctx.open;

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.captchaCheck) input.checked = ctx.captchaCheck;

    			if (ctx.open) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					if_block.i(1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.i(1);
    					if_block.m(div3, null);
    				}
    			} else if (if_block) {
    				group_outros();
    				on_outro(() => {
    					if_block.d(1);
    					if_block = null;
    				});

    				if_block.o(1);
    				check_outros();
    			}

    			if (changed.open) details.open = ctx.open;

    			if ((!current || changed.theme || changed.size) && section_class_value !== (section_class_value = "" + ctx.theme + " " + ctx.size)) {
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
    			if (if_block) if_block.i();
    			current = true;
    		},

    		o: function outro(local) {
    			if (if_block) if_block.o();
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(section);
    			}

    			if (if_block) if_block.d();
    			run_all(dispose);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	

    	//Props
    	let { size = 'L', theme = 'flat', captchaServer = 'https://load.jsecoin.com' } = $$props;

    	//Events
    	const dispatch = createEventDispatcher();
    	
    	//Init captcha
    	let open = false;
    	let showCaptcha = false;
    	let captchaCheck = false;
    	let thinking = false;
    	let complete = false;

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

    	const writable_props = ['size', 'theme', 'captchaServer'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<JSECaptcha> was created with unknown prop '${key}'`);
    	});

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
    		theme,
    		captchaServer,
    		open,
    		showCaptcha,
    		captchaCheck,
    		thinking,
    		complete,
    		handleMovement,
    		callbackFunction,
    		input_change_handler,
    		details_toggle_handler
    	};
    }

    class JSECaptcha extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-e99oh1-style")) add_css();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["size", "theme", "captchaServer"]);
    	}

    	get size() {
    		throw new Error("<JSECaptcha>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
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

    function create_fragment$2(ctx) {
    	var current;

    	var jsecaptcha = new JSECaptcha({
    		props: { theme: "flat", size: "M" },
    		$$inline: true
    	});
    	jsecaptcha.$on("success", success_handler);
    	jsecaptcha.$on("fail", fail_handler);

    	return {
    		c: function create() {
    			jsecaptcha.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(jsecaptcha, target, anchor);
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
    			jsecaptcha.$destroy(detaching);
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
