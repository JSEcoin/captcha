
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

    function add_css() {
    	var style = element("style");
    	style.id = 'svelte-14hrccn-style';
    	style.textContent = ".a,.c{fill:none}.game.svelte-14hrccn{height:100%;background-size:350px;background-repeat:no-repeat;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='254.732' height='142.65' viewBox='0 0 254.732 142.65'%3E%3Crect width='254.732' height='142.65' fill='%2326136e'/%3E%3Cg transform='translate(13.799 8.326)'%3E%3Cg transform='translate(66.725 16.157)'%3E%3Cpath d='M600.042,261.883A46.842,46.842,0,1,0,553.2,215.042a46.93,46.93,0,0,0,46.842,46.842Z' transform='translate(-553.2 -168.2)' fill='%23331178' fill-rule='evenodd'/%3E%3Cpath d='M637.039,292.578A40.539,40.539,0,1,0,596.5,252.039a40.616,40.616,0,0,0,40.539,40.539Z' transform='translate(-590.197 -205.197)' fill='%233a1580' fill-rule='evenodd'/%3E%3Cpath d='M694.542,340.285A30.743,30.743,0,1,0,663.8,309.543a30.807,30.807,0,0,0,30.742,30.743Z' transform='translate(-647.701 -262.701)' fill='%2344158f' fill-rule='evenodd'/%3E%3Cpath d='M751.534,387.567A21.034,21.034,0,1,0,730.5,366.534a21.072,21.072,0,0,0,21.034,21.034Z' transform='translate(-704.692 -319.692)' fill='%23521b96' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(0)'%3E%3Cpath d='M112.413,92.411A17.606,17.606,0,1,0,94.8,74.8a17.643,17.643,0,0,0,17.613,17.613Z' transform='translate(-94.8 -57.2)' fill='%23341270' fill-rule='evenodd'/%3E%3Cpath d='M126.34,103.966a15.233,15.233,0,1,0-15.24-15.24,15.26,15.26,0,0,0,15.24,15.24Z' transform='translate(-108.727 -71.127)' fill='%233d1273' fill-rule='evenodd'/%3E%3Cpath d='M147.958,121.9A11.55,11.55,0,1,0,136.4,110.343,11.573,11.573,0,0,0,147.958,121.9Z' transform='translate(-130.345 -92.745)' fill='%23491279' fill-rule='evenodd'/%3E%3Cpath d='M169.4,139.608a7.9,7.9,0,1,0-7.9-7.9,7.921,7.921,0,0,0,7.9,7.9Z' transform='translate(-151.791 -114.106)' fill='%2355147f' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(191.777 14.905)'%3E%3Cpath d='M1418.952,172.9a6.652,6.652,0,1,0-6.652-6.652,6.66,6.66,0,0,0,6.652,6.652Z' transform='translate(-1412.3 -159.6)' fill='%23341270' fill-rule='evenodd'/%3E%3Cpath d='M1424.249,177.314a5.757,5.757,0,1,0-5.75-5.75,5.774,5.774,0,0,0,5.75,5.75Z' transform='translate(-1417.597 -164.898)' fill='%233d1273' fill-rule='evenodd'/%3E%3Cpath d='M1432.367,184.034a4.367,4.367,0,1,0-4.367-4.367,4.38,4.38,0,0,0,4.367,4.367Z' transform='translate(-1425.715 -173.015)' fill='%23491279' fill-rule='evenodd'/%3E%3Cpath d='M1440.484,190.768a2.984,2.984,0,1,0-2.984-2.984,2.988,2.988,0,0,0,2.984,2.984Z' transform='translate(-1433.832 -181.132)' fill='%2355147f' fill-rule='evenodd'/%3E%3C/g%3E%3C/g%3E%3Cg transform='translate(198.997 65.488)'%3E%3Cpath d='M1377.433,470.38a10.24,10.24,0,1,0-10.233-10.247,10.263,10.263,0,0,0,10.233,10.247Z' transform='translate(-1367.185 -449.9)' fill='%23f66' fill-rule='evenodd'/%3E%3Cpath d='M1391.076,449.9a10.24,10.24,0,1,1,0,20.48c-1.033-.277-3.2-.451-2.853-1.412.175-.48,1.543.189,2.9.306,1.805.131,3.7-.233,3.916-.815.306-.873-1.863-.291-4.367-.422-2.969-.16-6.376-1.033-6.288-2.416.073-1.048,3.057.306,6,.568,3,.277,5.953-.553,6.114-2.3.16-1.776-2.737-1.325-6.084-1.4-3.13-.073-7.1-1.135-7.234-3.028-.146-2.038,3.057-1.194,6.084-1.252,3.057-.058,5.953-1.034,5.415-3.071-.291-1.106-2.111-.408-4.367-.306s-4.993-.378-5.167-1.31c-.32-1.747,3.784-3.406,5.939-3.625Z' transform='translate(-1380.829 -449.9)' fill='%23c43f57' fill-rule='evenodd'/%3E%3Cpath d='M1377.348,449.9c.335,0,.67.015.99.044h-.233a10.25,10.25,0,0,0-.99,20.451,10.249,10.249,0,0,1,.233-20.5Z' transform='translate(-1367.1 -449.9)' fill='%23df99ff' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(72.271 34.338)'%3E%3Cpath d='M498.727,240.354a2.227,2.227,0,1,0-2.227-2.227,2.236,2.236,0,0,0,2.227,2.227Z' transform='translate(-496.5 -235.9)' fill='%237c1370' fill-rule='evenodd'/%3E%3Cpath d='M505.589,238.315a2.228,2.228,0,0,1-1.223,4.09,1.582,1.582,0,0,1-.262-.015,2.228,2.228,0,0,1,1.223-4.09c.087,0,.175.015.262.015Z' transform='translate(-502.139 -237.951)' fill='%23be2385' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(112.024 55.983)'%3E%3Cpath d='M784.942,415.284A15.342,15.342,0,1,0,769.6,399.942a15.372,15.372,0,0,0,15.342,15.342Z' transform='translate(-769.6 -384.6)' fill='%236838a4' fill-rule='evenodd'/%3E%3Cpath d='M804.167,431.234A12.067,12.067,0,1,0,792.1,419.167a12.092,12.092,0,0,0,12.067,12.067Z' transform='translate(-788.825 -403.825)' fill='%23794dae' fill-rule='evenodd'/%3E%3Cpath d='M819.718,444.136a9.418,9.418,0,1,0-9.418-9.418,9.433,9.433,0,0,0,9.418,9.418Z' transform='translate(-804.376 -419.376)' fill='%239e7ec5' fill-rule='evenodd'/%3E%3Cpath d='M827.151,450.3A8.151,8.151,0,1,0,819,442.151a8.166,8.166,0,0,0,8.151,8.151Z' transform='translate(-811.809 -426.809)' fill='%23fff' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(44.134 114.12)'%3E%3Cpath d='M303.984,888.147a.755.755,0,0,1,.393.1c.116.073,13.974-7.773,14.047-7.656s-13.625,8.21-13.625,8.37a.8.8,0,1,1-1.6,0,.79.79,0,0,1,.786-.815Z' transform='translate(-303.197 -866.531)' fill='%23ffc' fill-rule='evenodd'/%3E%3Cpath d='M304.926,934.952a.626.626,0,1,0,0-1.252.621.621,0,0,0-.626.626.631.631,0,0,0,.626.626Z' transform='translate(-304.139 -911.909)' fill='%23ff6' fill-rule='evenodd'/%3E%3Cpath d='M305.822,936.344a.422.422,0,1,0-.422-.422.422.422,0,0,0,.422.422Z' transform='translate(-305.079 -913.447)' fill='%23fc0' fill-rule='evenodd'/%3E%3Cpath d='M425.943,796.372c.029-.015,21.368-12.416,21.4-12.373s-21.208,12.591-21.252,12.62c-.291.175-.408-.087-.146-.247Z' transform='translate(-407.951 -783.999)' fill='%23ffc' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(7.773 4.09)'%3E%3Cpath d='M641.864,111.213a.36.36,0,0,0,.364-.364.348.348,0,0,0-.364-.349.357.357,0,1,0,0,.713Z' transform='translate(-555.896 -98.506)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M480.564,81.628a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-418.075 -73.214)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M416.364,279.228a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-363.22 -242.051)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M554.064,530.028a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-480.876 -456.345)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M421.264,652.213a.357.357,0,0,0,.364-.349.37.37,0,0,0-.364-.364.357.357,0,1,0,0,.713Z' transform='translate(-367.406 -560.757)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M473.164,662.028a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-411.752 -569.131)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M687.964,847.128a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-595.285 -727.287)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M621.364,891.713a.36.36,0,0,0,.364-.364.348.348,0,0,0-.364-.349.357.357,0,1,0,0,.713Z' transform='translate(-538.38 -765.395)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M179.264,689.128a.364.364,0,1,0-.364-.364.38.38,0,0,0,.364.364Z' transform='translate(-160.632 -592.286)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M799.164,642.228a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-690.299 -552.213)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1028.764,745.928a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-886.478 -640.818)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1243.664,543.428a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1070.097 -467.794)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1401.664,348.328a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-1205.098 -301.093)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1362.164,254.528a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1171.348 -220.947)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1473.944,203.613a.357.357,0,1,0,0-.713.348.348,0,0,0-.349.364.336.336,0,0,0,.349.349Z' transform='translate(-1266.869 -177.456)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1552.364,197.728a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1333.862 -172.415)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1453.364,157.728a.364.364,0,1,0-.364-.364.352.352,0,0,0,.364.364Z' transform='translate(-1249.273 -138.237)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1305.364,39.728a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-1122.816 -37.413)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1673.364,39.728a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-1437.249 -37.413)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1663.464,229.828a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1428.79 -199.842)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1539.964,471.828a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1323.267 -406.616)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1651.064,578.028a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-1418.195 -497.358)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1591.864,753.413a.36.36,0,0,0,.364-.364.348.348,0,0,0-.364-.349.357.357,0,1,0,0,.713Z' transform='translate(-1367.612 -647.226)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1273.264,738.528a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1095.388 -634.495)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1142.364,859.528a.364.364,0,1,0-.364-.364.38.38,0,0,0,.364.364Z' transform='translate(-983.542 -737.882)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1026.364,123.628a.348.348,0,0,0,.349-.364.357.357,0,1,0-.349.364Z' transform='translate(-884.427 -109.101)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M132.364,52.028a.348.348,0,0,0,.349-.364.357.357,0,1,0-.713,0,.37.37,0,0,0,.364.364Z' transform='translate(-120.559 -47.923)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M145.2,62.494a.59.59,0,0,0,.6-.6.6.6,0,0,0-.6-.6.609.609,0,0,0-.6.6.6.6,0,0,0,.6.6Z' transform='translate(-131.325 -56.467)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M279.6,29.294a.6.6,0,0,0,.6-.6.609.609,0,0,0-.6-.6.6.6,0,0,0-.6.6.59.59,0,0,0,.6.6Z' transform='translate(-246.161 -28.1)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M329,76.194a.609.609,0,0,0,.6-.6.6.6,0,0,0-.6-.6.6.6,0,0,0,0,1.194Z' transform='translate(-288.371 -68.173)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M641.3,52.794a.6.6,0,0,0,.6-.6.59.59,0,0,0-.6-.6.6.6,0,0,0,0,1.194Z' transform='translate(-555.212 -48.179)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M266.4,375.394a.6.6,0,0,0,.6-.6.609.609,0,0,0-.6-.6.6.6,0,0,0-.6.6.59.59,0,0,0,.6.6Z' transform='translate(-234.883 -323.821)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M572.6,718.694a.6.6,0,0,0,.6-.6.609.609,0,0,0-.6-.6.6.6,0,1,0,0,1.194Z' transform='translate(-496.512 -617.15)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M54,876.694a.6.6,0,1,0,0-1.194.609.609,0,0,0-.6.6.6.6,0,0,0,.6.6Z' transform='translate(-53.4 -752.152)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1002.3,908.794a.59.59,0,0,0,.6-.6.6.6,0,0,0-.6-.6.609.609,0,0,0-.6.6.59.59,0,0,0,.6.6Z' transform='translate(-863.664 -779.579)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1192.9,474.194a.6.6,0,0,0,.6-.6.59.59,0,0,0-.6-.6.6.6,0,1,0,0,1.194Z' transform='translate(-1026.52 -408.24)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1588.1,673.494a.59.59,0,0,0,.6-.6.6.6,0,0,0-.6-.6.609.609,0,0,0-.6.6.6.6,0,0,0,.6.6Z' transform='translate(-1364.195 -578.53)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M935.4,220.094a.6.6,0,0,0,.6-.6.59.59,0,0,0-.6-.6.6.6,0,0,0-.6.6.59.59,0,0,0,.6.6Z' transform='translate(-806.502 -191.127)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1582.6,63.494a.609.609,0,0,0,.6-.6.6.6,0,1,0-1.194,0,.609.609,0,0,0,.6.6Z' transform='translate(-1359.495 -57.322)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M679.247,446.995a.247.247,0,1,0-.247-.247.245.245,0,0,0,.247.247Z' transform='translate(-587.937 -385.597)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M677.547,160.995a.255.255,0,0,0,.247-.247.245.245,0,0,0-.247-.247.247.247,0,1,0,0,.495Z' transform='translate(-586.484 -141.228)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M965.247,65.595a.255.255,0,0,0,.247-.247.245.245,0,0,0-.247-.247.237.237,0,0,0-.247.247.245.245,0,0,0,.247.247Z' transform='translate(-832.306 -59.714)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1315.948,297.695a.247.247,0,1,0-.247-.247.237.237,0,0,0,.247.247Z' transform='translate(-1131.958 -258.029)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1565.348,297.695a.255.255,0,0,0,.247-.247.245.245,0,0,0-.247-.247.255.255,0,0,0-.248.247.237.237,0,0,0,.248.247Z' transform='translate(-1345.055 -258.029)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1627.048,517.495a.247.247,0,0,0,0-.495.247.247,0,1,0,0,.495Z' transform='translate(-1397.774 -445.835)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1041.748,537.295a.247.247,0,0,0,0-.495.247.247,0,1,0,0,.495Z' transform='translate(-897.671 -462.753)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1138.147,729.895a.247.247,0,1,0-.247-.247.245.245,0,0,0,.247.247Z' transform='translate(-980.039 -627.318)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M426.947,406.395a.247.247,0,1,0,0-.495.255.255,0,0,0-.247.247.245.245,0,0,0,.247.247Z' transform='translate(-372.362 -350.907)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M256.447,213.195a.247.247,0,1,0-.247-.247.245.245,0,0,0,.247.247Z' transform='translate(-226.68 -185.829)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M251.547,337.295a.247.247,0,1,0-.247-.247.255.255,0,0,0,.247.247Z' transform='translate(-222.493 -291.865)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M157.747,510.095a.247.247,0,0,0,0-.495.245.245,0,0,0-.247.247.237.237,0,0,0,.247.247Z' transform='translate(-142.347 -439.512)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M214.347,175.195a.245.245,0,0,0,.247-.247.247.247,0,0,0-.495,0,.245.245,0,0,0,.247.247Z' transform='translate(-190.708 -153.361)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M370.14,322.495a.255.255,0,0,0,.247-.247.245.245,0,0,0-.247-.247.255.255,0,0,0-.247.247.237.237,0,0,0,.247.247Z' transform='translate(-323.823 -279.22)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M192.647,872.695a.247.247,0,1,0-.247-.247.245.245,0,0,0,.247.247Z' transform='translate(-172.167 -749.332)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M542.948,937.295a.255.255,0,0,0,.247-.247.245.245,0,0,0-.247-.247.255.255,0,0,0-.247.247.245.245,0,0,0,.247.247Z' transform='translate(-471.477 -804.529)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1691.248,881.995a.247.247,0,1,0-.248-.247.255.255,0,0,0,.248.247Z' transform='translate(-1452.629 -757.278)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1331.448,644.195a.247.247,0,0,0,0-.495.247.247,0,0,0,0,.495Z' transform='translate(-1145.202 -554.093)' fill='%23fff' fill-rule='evenodd'/%3E%3C/g%3E%3C/svg%3E\");cursor:url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"40\" height=\"40\" viewBox=\"0 0 40 40\"><g transform=\"translate(-844 -500)\"><g transform=\"translate(844 -520.36)\"><path d=\"M194.787,1212.29a2.858,2.858,0,1,0,2.858,2.858,2.869,2.869,0,0,0-2.858-2.858Z\" transform=\"translate(-174.792 -174.793)\" fill=\"%23868686\"/><path d=\"M209.416,1228.35a1.429,1.429,0,1,1-1.424,1.424,1.419,1.419,0,0,1,1.424-1.424Z\" transform=\"translate(-189.421 -189.419)\" fill=\"%23ff655b\"/><g transform=\"translate(0 1020.36)\"><path d=\"M216.024,1020.36v12.855h1.424V1020.36Z\" transform=\"translate(-196.736 -1020.36)\" fill=\"%23868686\"/><path d=\"M216.024,1324.26v12.866h1.424V1324.26Z\" transform=\"translate(-196.736 -1297.126)\" fill=\"%23868686\"/><path d=\"M304.016,1236.27v1.434h12.855v-1.434Z\" transform=\"translate(-276.871 -1216.992)\" fill=\"%23868686\"/><path d=\"M0,1236.27v1.434H12.855v-1.434Z\" transform=\"translate(0 -1216.992)\" fill=\"%23868686\"/></g><g transform=\"translate(8.861 1029.216)\"><path d=\"M244.5,1119.548a.714.714,0,0,0-.12,1.409,10,10,0,0,1,7.4,7.391.715.715,0,0,0,1.391-.33v0a11.431,11.431,0,0,0-8.454-8.443.718.718,0,0,0-.212-.023Z\" transform=\"translate(-230.918 -1119.547)\" fill=\"%23868686\"/><path d=\"M107.971,1119.589a.721.721,0,0,0-.19.023,11.428,11.428,0,0,0-8.44,8.427.714.714,0,0,0,1.379.369c0-.01.005-.021.008-.031a10,10,0,0,1,7.386-7.377.714.714,0,0,0-.142-1.409Z\" transform=\"translate(-99.31 -1119.586)\" fill=\"%23868686\"/><path d=\"M252.407,1264.338a.714.714,0,0,0-.712.555,10,10,0,0,1-7.386,7.38.714.714,0,0,0,.282,1.4l.053-.013a11.43,11.43,0,0,0,8.44-8.429.713.713,0,0,0-.678-.893Z\" transform=\"translate(-230.835 -1251.41)\" fill=\"%23868686\"/><path d=\"M99.924,1264.077a.714.714,0,0,0-.656.89,11.431,11.431,0,0,0,8.44,8.454.715.715,0,0,0,.335-1.39h0a9.995,9.995,0,0,1-7.386-7.4.714.714,0,0,0-.734-.558h0Z\" transform=\"translate(-99.246 -1251.172)\" fill=\"%23868686\"/></g><g transform=\"translate(2 1022.36)\" fill=\"none\" stroke=\"%23707070\" stroke-width=\"2\"><circle cx=\"18\" cy=\"18\" r=\"18\" stroke=\"none\"/><circle cx=\"18\" cy=\"18\" r=\"17\" fill=\"none\"/></g></g></g></svg>') 16 16, auto}.gfx.svelte-14hrccn{position:absolute;opacity:1;transition:opacity 0.6s}.gfx.active.svelte-14hrccn{opacity:0}.asteroid.svelte-14hrccn{width:40px;height:40px;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg transform='translate(0 0)'%3E%3Cpath d='M230.994,11.742,221.867,22.4v2A14.671,14.671,0,0,0,236.3,12.366,25.741,25.741,0,0,0,230.994,11.742Z' transform='translate(-195.867 -10.366)' fill='%234a8dc6'/%3E%3Cpath d='M146.179,11.984l.035-.268a31.976,31.976,0,0,0-20.381,7.4,14.635,14.635,0,0,0,11.254,5.262v-2C141.56,22.375,145.383,18,146.179,11.984Z' transform='translate(-111.088 -10.34)' fill='%2377aad4'/%3E%3Cpath d='M241.059,24.221A10.663,10.663,0,0,0,233.9,7.441a22.167,22.167,0,0,0-8.472-4.913c.011-.057.022-.114.033-.171a2,2,0,0,0-3.936-.713,12.621,12.621,0,0,1-1.353,3.82l-12.81,51.886a10.663,10.663,0,0,0,17.178-4.719,35.188,35.188,0,0,0,4.576-3.339,4.666,4.666,0,0,0,5.2-5.506A31.8,31.8,0,0,0,241.059,24.221Z' transform='translate(-183.064 0)' fill='%23a5c6e3'/%3E%3Cpath d='M53.914,67.8c.528-6.259-1.372-11.9-5.351-15.875A18.917,18.917,0,0,0,37.11,46.619a12.672,12.672,0,0,1-20.83,2.026,2,2,0,1,0-3.068,2.567l.016.019q-.657.6-1.293,1.229a35.744,35.744,0,0,0-4.177,5.017A12.672,12.672,0,0,0,2.013,76.009,23.1,23.1,0,0,0,8.608,91.916,23.064,23.064,0,0,0,24.3,98.505a51.738,51.738,0,0,0,20.936-12.78A29.072,29.072,0,0,0,53.914,67.8Z' transform='translate(0 -41.156)' fill='%23d2e3f1'/%3E%3Cpath d='M267.378,364.089v13.333a6.667,6.667,0,0,0,0-13.333Z' transform='translate(-236.045 -321.423)' fill='%234a8dc6'/%3E%3Cpath d='M219.821,370.756c0-3.682-1.194-6.667-2.667-6.667a6.667,6.667,0,0,0,0,13.333C218.628,377.422,219.821,374.438,219.821,370.756Z' transform='translate(-185.821 -321.423)' fill='%2377aad4'/%3E%3Cpath d='M420.978,96.711v13.333a6.667,6.667,0,0,0,0-13.333Z' transform='translate(-371.645 -85.378)' fill='%234a8dc6'/%3E%3Cpath d='M373.421,103.378c0-3.682-1.194-6.667-2.667-6.667a6.667,6.667,0,1,0,0,13.333C372.228,110.044,373.421,107.06,373.421,103.378Z' transform='translate(-321.421 -85.378)' fill='%2377aad4'/%3E%3Cg transform='translate(15.667 25)'%3E%3Ccircle cx='1' cy='1' r='1' transform='translate(13.333 4)' fill='%23a5c6e3'/%3E%3Ccircle cx='1' cy='1' r='1' transform='translate(17.333)' fill='%23a5c6e3'/%3E%3Ccircle cx='1' cy='1' r='1' transform='translate(28 12.667)' fill='%23a5c6e3'/%3E%3Ccircle cx='1' cy='1' r='1' transform='translate(0 24.667)' fill='%23a5c6e3'/%3E%3C/g%3E%3Cpath d='M108.089,164.978v17.333a8.667,8.667,0,1,0,0-17.333Z' transform='translate(-95.422 -145.645)' fill='%234a8dc6'/%3E%3Cpath d='M47.466,173.644c0-4.786-2.089-8.667-4.667-8.667a8.667,8.667,0,1,0,0,17.333C45.377,182.31,47.466,178.43,47.466,173.644Z' transform='translate(-30.133 -145.644)' fill='%2377aad4'/%3E%3C/g%3E%3C/svg%3E\");background-size:contain;background-repeat:no-repeat}.spaceship.svelte-14hrccn{width:36px;height:46px;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='26.342' height='36' viewBox='0 0 26.342 36'%3E%3Cg transform='translate(-123.583 0)'%3E%3Cpath d='M136.755,150.063l-12.512,10.01a1.756,1.756,0,0,0-.659,1.371v4.424l13.171-2.634,13.171,2.634v-4.424a1.756,1.756,0,0,0-.659-1.371Z' transform='translate(-0.001 -135.137)' fill='%23ff6464'/%3E%3Cpath d='M220.616,313.138l-1.044-4.177h-6.64l-1.044,4.177a.878.878,0,0,0,.852,1.091h7.025a.878.878,0,0,0,.852-1.091Z' transform='translate(-79.498 -278.23)' fill='%23959cb3'/%3E%3Cpath d='M214.523,313.138l1.044-4.177h-2.634l-1.044,4.177a.878.878,0,0,0,.852,1.091h2.634a.878.878,0,0,1-.852-1.091Z' transform='translate(-79.498 -278.23)' fill='%23707487'/%3E%3Cpath d='M207.569.429,203.48,7.736a3.513,3.513,0,0,0-.447,1.715V30.732a1.756,1.756,0,0,0,1.756,1.756h7.025a1.756,1.756,0,0,0,1.756-1.756V9.45a3.511,3.511,0,0,0-.447-1.715L209.034.429A.839.839,0,0,0,207.569.429Z' transform='translate(-71.547 0)' fill='%23e4eaf6'/%3E%3Cpath d='M206.545,30.781V9.5a7.658,7.658,0,0,1,.186-1.715l1.7-7.307a1.111,1.111,0,0,1,.157-.371.833.833,0,0,0-1.023.371L203.48,7.785a3.513,3.513,0,0,0-.447,1.715V30.781a1.756,1.756,0,0,0,1.756,1.756h2.488C206.873,32.537,206.545,31.751,206.545,30.781Z' transform='translate(-71.547 -0.049)' fill='%23c7cfe2'/%3E%3Cpath d='M209.035.43a.839.839,0,0,0-1.464,0l-4.089,7.307a3.513,3.513,0,0,0-.447,1.715v4.6h10.537v-4.6a3.511,3.511,0,0,0-.447-1.715Z' transform='translate(-71.548 -0.001)' fill='%23ff6464'/%3E%3Cpath d='M206.546,9.512a7.658,7.658,0,0,1,.186-1.715l1.7-7.307a1.111,1.111,0,0,1,.157-.371.86.86,0,0,0-.553-.012c-.013,0-.026.011-.039.016a.812.812,0,0,0-.193.106c-.019.014-.038.027-.056.043a.821.821,0,0,0-.182.218L203.481,7.8a3.513,3.513,0,0,0-.447,1.715v4.6h3.512Z' transform='translate(-71.548 -0.061)' fill='%23d2555a'/%3E%3Cpath d='M213.571,141.235H203.034v1.756h2.252a3.469,3.469,0,0,0,6.034,0h2.252v-1.756Z' transform='translate(-71.548 -127.187)' fill='%23c7cfe2'/%3E%3Ccircle cx='1.756' cy='1.756' r='1.756' transform='translate(134.999 12.292)' fill='%235b5d6e'/%3E%3Cpath d='M206.546,144.266v-3.032h-3.512v1.756h2.252A3.551,3.551,0,0,0,206.546,144.266Z' transform='translate(-71.548 -127.186)' fill='%23afb9d2'/%3E%3Cpath d='M219.677.429l-3.2,5.716h7.863l-3.2-5.716A.839.839,0,0,0,219.677.429Z' transform='translate(-83.655 0)' fill='%23707487'/%3E%3Cpath d='M219.211,6.206,220.544.489A1.111,1.111,0,0,1,220.7.118a.86.86,0,0,0-.553-.012l-.011,0-.028.011a.812.812,0,0,0-.193.106l-.02.015c-.012.009-.025.018-.037.028a.823.823,0,0,0-.182.218l-3.2,5.716h2.732Z' transform='translate(-83.656 -0.06)' fill='%235b5d6e'/%3E%3Cg transform='translate(123.583 25.463)'%3E%3Cpath d='M123.584,261.264l7.9-1.581V256l-7.9,2.107Z' transform='translate(-123.584 -255.996)' fill='%23d2555a'/%3E%3Cpath d='M316.87,261.264l-7.9-1.581V256l7.9,2.107Z' transform='translate(-290.527 -255.996)' fill='%23d2555a'/%3E%3C/g%3E%3Cg transform='translate(123.583 25.463)'%3E%3Cpath d='M124.462,264.824h0a.878.878,0,0,0-.878.878v7.025a.878.878,0,0,0,.878.878h0a.878.878,0,0,0,.878-.878V265.7A.878.878,0,0,0,124.462,264.824Z' transform='translate(-123.584 -263.946)' fill='%23afb9d2'/%3E%3Cpath d='M159.773,256h0a.878.878,0,0,0-.878.878v4.39a.878.878,0,0,0,.878.878h0a.878.878,0,0,0,.878-.878v-4.39A.878.878,0,0,0,159.773,256Z' transform='translate(-155.383 -255.996)' fill='%23afb9d2'/%3E%3Cpath d='M371.639,264.824h0a.878.878,0,0,1,.878.878v7.025a.878.878,0,0,1-.878.878h0a.878.878,0,0,1-.878-.878V265.7A.878.878,0,0,1,371.639,264.824Z' transform='translate(-346.175 -263.946)' fill='%23afb9d2'/%3E%3Cpath d='M336.328,256h0a.878.878,0,0,1,.878.878v4.39a.878.878,0,0,1-.878.878h0a.878.878,0,0,1-.878-.878v-4.39A.878.878,0,0,1,336.328,256Z' transform='translate(-314.376 -255.996)' fill='%23afb9d2'/%3E%3C/g%3E%3Cg transform='translate(123.583 25.446)'%3E%3Ccircle cx='0.895' cy='0.895' r='0.895' transform='translate(0 0.862)' fill='%23959cb3'/%3E%3Ccircle cx='0.895' cy='0.895' r='0.895' transform='translate(3.496)' fill='%23959cb3'/%3E%3Ccircle cx='0.895' cy='0.895' r='0.895' transform='translate(24.552 0.862)' fill='%23959cb3'/%3E%3Ccircle cx='0.895' cy='0.895' r='0.895' transform='translate(21.057)' fill='%23959cb3'/%3E%3C/g%3E%3Cg transform='translate(135.876 23.707)'%3E%3Cpath d='M248.05,243.608h0a.878.878,0,0,0,.878-.878v-3.512a.878.878,0,0,0-.878-.878h0a.878.878,0,0,0-.878.878v3.512A.878.878,0,0,0,248.05,243.608Z' transform='translate(-247.172 -238.34)' fill='%23c7cfe2'/%3E%3Cpath d='M274.534,243.608h0a.878.878,0,0,0,.878-.878v-3.512a.878.878,0,0,0-.878-.878h0a.878.878,0,0,0-.878.878v3.512A.878.878,0,0,0,274.534,243.608Z' transform='translate(-271.022 -238.34)' fill='%23c7cfe2'/%3E%3C/g%3E%3Cpath d='M221.567,243.608h0a.878.878,0,0,0,.878-.878v-3.512a.878.878,0,0,0-.878-.878h0a.878.878,0,0,0-.878.878v3.512A.878.878,0,0,0,221.567,243.608Z' transform='translate(-87.447 -214.633)' fill='%23afb9d2'/%3E%3C/g%3E%3C/svg%3E\");background-size:contain;background-repeat:no-repeat}.asteroid.active.svelte-14hrccn{width:60px;height:60px;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='65' height='64' viewBox='0 0 65 64'%3E%3Cg transform='translate(-1003 -490)'%3E%3Ccircle cx='23.5' cy='23.5' r='23.5' transform='translate(1009 502)' fill='%23d2e3f1'/%3E%3Ccircle cx='9' cy='9' r='9' transform='translate(1009 502)' fill='%23d2e3f1'/%3E%3Ccircle cx='12' cy='12' r='12' transform='translate(1021 490)' fill='%23d2e3f1'/%3E%3Ccircle cx='12' cy='12' r='12' transform='translate(1033 499)' fill='%23d2e3f1'/%3E%3Ccircle cx='12' cy='12' r='12' transform='translate(1003 520)' fill='%23d2e3f1'/%3E%3Ccircle cx='12' cy='12' r='12' transform='translate(1033 530)' fill='%23d2e3f1'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1048 523)' fill='%23d2e3f1'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1010 523)' fill='%234a8dc6'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1015 514)' fill='%234a8dc6'/%3E%3Ccircle cx='18' cy='18' r='18' transform='translate(1018 504)' fill='%234a8dc6'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1010 523)' fill='%234a8dc6'/%3E%3Ccircle cx='4.5' cy='4.5' r='4.5' transform='translate(1059 513)' fill='%23d2e3f1'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1036 533)' fill='%234a8dc6'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1027 499)' fill='%234a8dc6'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1020 518)' fill='%2377aad4'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1033 507)' fill='%2377aad4'/%3E%3Ccircle cx='5.5' cy='5.5' r='5.5' transform='translate(1037 527)' fill='%2377aad4'/%3E%3Ccircle cx='4' cy='4' r='4' transform='translate(1037 527)' fill='%23fff'/%3E%3Ccircle cx='4' cy='4' r='4' transform='translate(1026 520)' fill='%23fff'/%3E%3Ccircle cx='4' cy='4' r='4' transform='translate(1040 511)' fill='%23fff'/%3E%3C/g%3E%3C/svg%3E\");background-size:contain;background-repeat:no-repeat}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXN0ZXJvaWRzLnN2ZWx0ZSIsInNvdXJjZXMiOlsiQXN0ZXJvaWRzLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8IS0tIERPTSBUYWcgTmFtZS0tPlxuPHN2ZWx0ZTpvcHRpb25zIHRhZz1cImpzZS1hc3Rlcm9pZHNcIi8+XG48IS0tIHhET00gVGFnIE5hbWUtLT5cbjxkaXYgaWQ9XCJKU0UtZ2FtZVwiIGNsYXNzPVwiZ2FtZVwiIG9uOmNsaWNrPVwie2NhcHRjaGFDbGlja31cIiBvbjptb3VzZW1vdmU9XCJ7bW92ZVNwYWNlc2hpcH1cIiBvbjp0b3VjaG1vdmU9XCJ7bW92ZVNwYWNlc2hpcH1cIj5cblx0eyNlYWNoIGdhbWVFbGVtZW50IGFzIGVsZSwgaX1cblx0XHQ8ZGl2IG9uOmNsaWNrfG9uY2U9XCJ7KCkgPT4gc21hc2goaSl9XCIgY2xhc3M6YWN0aXZlPVwie2VsZS5zbWFzaGVkfVwiIGNsYXNzOmFzdGVyb2lkPVwieyhlbGUudHlwZSA9PT0gJ2FzdGVyb2lkJyl9XCIgY2xhc3M6c3BhY2VzaGlwPVwieyhlbGUudHlwZSA9PT0gJ3NwYWNlU2hpcCcpfVwiIGRyYWdnYWJsZT1cIntkcmFnZ2FibGV9XCIgY2xhc3M9XCJnZnhcIiBzdHlsZT1cInRyYW5zZm9ybTogcm90YXRlKHtlbGUucn1kZWcpOyB0b3A6IHtlbGUueX1weDsgbGVmdDoge2VsZS54fXB4O1wiPjwvZGl2PlxuXHR7L2VhY2h9XG48L2Rpdj5cbjxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHdpZHRoPVwiNjBcIiBoZWlnaHQ9XCI2MFwiIHZpZXdCb3g9XCIwIDAgNjAgNjBcIj48ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoMCAwKVwiPjxwYXRoIGQ9XCJNMjMwLjk5NCwxMS43NDIsMjIxLjg2NywyMi40djJBMTQuNjcxLDE0LjY3MSwwLDAsMCwyMzYuMywxMi4zNjYsMjUuNzQxLDI1Ljc0MSwwLDAsMCwyMzAuOTk0LDExLjc0MlpcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTE5NS44NjcgLTEwLjM2NilcIiBmaWxsPVwiIzRhOGRjNlwiLz48cGF0aCBkPVwiTTE0Ni4xNzksMTEuOTg0bC4wMzUtLjI2OGEzMS45NzYsMzEuOTc2LDAsMCwwLTIwLjM4MSw3LjQsMTQuNjM1LDE0LjYzNSwwLDAsMCwxMS4yNTQsNS4yNjJ2LTJDMTQxLjU2LDIyLjM3NSwxNDUuMzgzLDE4LDE0Ni4xNzksMTEuOTg0WlwiIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgtMTExLjA4OCAtMTAuMzQpXCIgZmlsbD1cIiM3N2FhZDRcIi8+PHBhdGggZD1cIk0yNDEuMDU5LDI0LjIyMUExMC42NjMsMTAuNjYzLDAsMCwwLDIzMy45LDcuNDQxYTIyLjE2NywyMi4xNjcsMCwwLDAtOC40NzItNC45MTNjLjAxMS0uMDU3LjAyMi0uMTE0LjAzMy0uMTcxYTIsMiwwLDAsMC0zLjkzNi0uNzEzLDEyLjYyMSwxMi42MjEsMCwwLDEtMS4zNTMsMy44MmwtMTIuODEsNTEuODg2YTEwLjY2MywxMC42NjMsMCwwLDAsMTcuMTc4LTQuNzE5LDM1LjE4OCwzNS4xODgsMCwwLDAsNC41NzYtMy4zMzksNC42NjYsNC42NjYsMCwwLDAsNS4yLTUuNTA2QTMxLjgsMzEuOCwwLDAsMCwyNDEuMDU5LDI0LjIyMVpcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTE4My4wNjQgMClcIiBmaWxsPVwiI2E1YzZlM1wiLz48cGF0aCBkPVwiTTUzLjkxNCw2Ny44Yy41MjgtNi4yNTktMS4zNzItMTEuOS01LjM1MS0xNS44NzVBMTguOTE3LDE4LjkxNywwLDAsMCwzNy4xMSw0Ni42MTlhMTIuNjcyLDEyLjY3MiwwLDAsMS0yMC44MywyLjAyNiwyLDIsMCwxLDAtMy4wNjgsMi41NjdsLjAxNi4wMTlxLS42NTcuNi0xLjI5MywxLjIyOWEzNS43NDQsMzUuNzQ0LDAsMCwwLTQuMTc3LDUuMDE3QTEyLjY3MiwxMi42NzIsMCwwLDAsMi4wMTMsNzYuMDA5LDIzLjEsMjMuMSwwLDAsMCw4LjYwOCw5MS45MTYsMjMuMDY0LDIzLjA2NCwwLDAsMCwyNC4zLDk4LjUwNWE1MS43MzgsNTEuNzM4LDAsMCwwLDIwLjkzNi0xMi43OEEyOS4wNzIsMjkuMDcyLDAsMCwwLDUzLjkxNCw2Ny44WlwiIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgwIC00MS4xNTYpXCIgZmlsbD1cIiNkMmUzZjFcIi8+PHBhdGggZD1cIk0yNjcuMzc4LDM2NC4wODl2MTMuMzMzYTYuNjY3LDYuNjY3LDAsMCwwLDAtMTMuMzMzWlwiIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgtMjM2LjA0NSAtMzIxLjQyMylcIiBmaWxsPVwiIzRhOGRjNlwiLz48cGF0aCBkPVwiTTIxOS44MjEsMzcwLjc1NmMwLTMuNjgyLTEuMTk0LTYuNjY3LTIuNjY3LTYuNjY3YTYuNjY3LDYuNjY3LDAsMCwwLDAsMTMuMzMzQzIxOC42MjgsMzc3LjQyMiwyMTkuODIxLDM3NC40MzgsMjE5LjgyMSwzNzAuNzU2WlwiIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgtMTg1LjgyMSAtMzIxLjQyMylcIiBmaWxsPVwiIzc3YWFkNFwiLz48cGF0aCBkPVwiTTQyMC45NzgsOTYuNzExdjEzLjMzM2E2LjY2Nyw2LjY2NywwLDAsMCwwLTEzLjMzM1pcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTM3MS42NDUgLTg1LjM3OClcIiBmaWxsPVwiIzRhOGRjNlwiLz48cGF0aCBkPVwiTTM3My40MjEsMTAzLjM3OGMwLTMuNjgyLTEuMTk0LTYuNjY3LTIuNjY3LTYuNjY3YTYuNjY3LDYuNjY3LDAsMSwwLDAsMTMuMzMzQzM3Mi4yMjgsMTEwLjA0NCwzNzMuNDIxLDEwNy4wNiwzNzMuNDIxLDEwMy4zNzhaXCIgdHJhbnNmb3JtPVwidHJhbnNsYXRlKC0zMjEuNDIxIC04NS4zNzgpXCIgZmlsbD1cIiM3N2FhZDRcIi8+PGcgdHJhbnNmb3JtPVwidHJhbnNsYXRlKDE1LjY2NyAyNSlcIj48Y2lyY2xlIGN4PVwiMVwiIGN5PVwiMVwiIHI9XCIxXCIgdHJhbnNmb3JtPVwidHJhbnNsYXRlKDEzLjMzMyA0KVwiIGZpbGw9XCIjYTVjNmUzXCIvPjxjaXJjbGUgY3g9XCIxXCIgY3k9XCIxXCIgcj1cIjFcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoMTcuMzMzKVwiIGZpbGw9XCIjYTVjNmUzXCIvPjxjaXJjbGUgY3g9XCIxXCIgY3k9XCIxXCIgcj1cIjFcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoMjggMTIuNjY3KVwiIGZpbGw9XCIjYTVjNmUzXCIvPjxjaXJjbGUgY3g9XCIxXCIgY3k9XCIxXCIgcj1cIjFcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoMCAyNC42NjcpXCIgZmlsbD1cIiNhNWM2ZTNcIi8+PC9nPjxwYXRoIGQ9XCJNMTA4LjA4OSwxNjQuOTc4djE3LjMzM2E4LjY2Nyw4LjY2NywwLDEsMCwwLTE3LjMzM1pcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTk1LjQyMiAtMTQ1LjY0NSlcIiBmaWxsPVwiIzRhOGRjNlwiLz48cGF0aCBkPVwiTTQ3LjQ2NiwxNzMuNjQ0YzAtNC43ODYtMi4wODktOC42NjctNC42NjctOC42NjdhOC42NjcsOC42NjcsMCwxLDAsMCwxNy4zMzNDNDUuMzc3LDE4Mi4zMSw0Ny40NjYsMTc4LjQzLDQ3LjQ2NiwxNzMuNjQ0WlwiIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgtMzAuMTMzIC0xNDUuNjQ0KVwiIGZpbGw9XCIjNzdhYWQ0XCIvPjwvZz48L3N2Zz5cblxuPHNjcmlwdD5cblx0aW1wb3J0IHsgb25Nb3VudCwgY3JlYXRlRXZlbnREaXNwYXRjaGVyIH0gZnJvbSAnc3ZlbHRlJztcblxuXHQvL0V2ZW50c1xuXHRjb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpO1xuXG5cdC8vRGF0YSBtb2RlbFxuXHRjb25zdCBtbERhdGEgPSB7IG1vdXNlQ2xpY2tzOjAgfTtcblxuXHQvL0dGWFxuXHRjb25zdCBzcGFjZVNoaXBJY28gPSAnZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFDTUFBQUE4Q0FZQUFBRHNXUU1YQUFBQUhIUkZXSFJUYjJaMGQyRnlaUUJCWkc5aVpTQkdhWEpsZDI5eWEzTWdRMU0yNkx5eWpBQUFDNDlKUkVGVWFON05tWHVRbGZWNXh6L1A3MzNQZmMvZVlCZlljbG1RT0lwVk1RZ3FDZ2g0cWJmcGdJSldGSnltNHpnU3hXQ1RPSjFKSnBOYWF6TjJKbW1UZEVwYm02cXhTVFVHeDBzMEdoQWhLSXBCTGdraUYxMldoUVdXWlhmUDdybThsOS9UUDg3WnM3dmhMS1p4MFo2Wk0yZm0vWjNmODM3ZjcvTjlicjlYVkpYL0x4OHpVb2ErdG5UUnVMOWRkT09FVDJQREhTa3c1eDFvVzlYbCsyT0J1ejVYWmw2OTZmb0pxVnpoZmxzSWxqODhlOTZGbnlzWWUrVEVnMjVvRTZvcWlaN00zM3h1WUo3NnMvbk41UDIvRWdTamlnbURteCtidTJENjV3S21xak43cnhPRUtRVVVBUnM2MHRYMWxjOGN6T08zM1RUS3pRZDNTSDkyRUJCckVOOWYvSjI1YzZaOHBtRHFQajYrMkFtQ2NSZ3BYbEJRb3hqVktqZm4zL1haZ1JFSTI3eTcvYzRRcjh0UzZJWmNqNUR2TnVTNklIY292MHprMXVqL3llUWZtNEgxbzJ2bUhkOXhiTDNSUUVRY2ZKdWpvKzhJUXBFbGk4dW81cm83bXE3WS8rTXpudlJlL25qczBzU2tsSWdBNGhBRUdicE9lQWlDQ0tnVnN1ME5TNWJEajg4b00zZCs2N0hVdGtQaHJrekJOQXVDT0E1ZU5zdlJsbjJJQ0lpZ0tGVng3WnJTR0puMm01K3VPWExHbVBuNEpGZUlvVG1Wc01VbmNzQzFJYWxVV0FaVGxKWFdIczBFMXdQL2NjWUVuTTJITjl2aXpjcGZJOFZmQmwxVFZXeW9pODlZTkYyLzZyRllBSFBRNG8zTGdxNGtjaEZDMVZsemJsODU3b3lBNmZHOTZhcDZ0Z3FJbWpLU1VBMkJtcEtMeW00aVVCM2QybE9ZZFViQStNYk1DY0dJQ21LVXZvSkxwczhsYWdKaVRrQlByME1tNXlKU2hLU3FGSHgvM2hrUnNCZktYRlZGREhUMnhwZzJycE43cjkzSlJlUDMwOTIxbC9kYlJ2RzlGMmV3YmU5WTZxbzlyRlY4Wk82SU03UHM2NCttckxWZkZBTzlXWmVMSmg3bjJiOStrVVd6b1NOeUs3MjFYMmJKZ25wZSsvWUx6RHYvRUNkN1hVUVVVYzZadGV6K3lTTUtabStmWGhncVk2MFZvcEdBUjVadXhvMmZ4LzBiVjdGazB3V3NlSGNCRDIzN0YvellWVHoycFRlb1N4VUlyRU9vcEk3MTVtZU9LQmdieW9XQWt5MDRUR3M2d1FXVE12eGt6N1U4MlhxTWJqMUdaM2lZcHc2MTgvT1dGZnpwUk12TXFVZko1aHhBOGIzZ2doRVdzSndQRUNyVXhUMXdvK3pMUkNuZ2tUUU9DU2VDcHdVTzlNVnhUQTMxVlRtc0JWVUlyWjQ3Z21DZUlsU21vRUxVaFVOZFZRU0ZQSmVNUGtwYWF1a09RakorU0swN2lpL1d0SkR6T3RoL3RBWTNVc3hBZ2VyaytiZXVpbzlJTk4zNDliYTBvczBxU2lJUzhrRjdIYzl2bmNqTjg1K2hMWHMzUHpuWWhESENMVTFIdU9XczcvSHNobkZzTzlCSUtoRVdFNkpLODBlOStWcWcvVk9ENmNtWkdxdGhreUlJbG5nazVKdlBYY3FvNnZXc25QRmQ3anA3SW4zNUZ1cGp1MW4vWGpXcjF5d2tZZ3lHSWhnVnJYUGpkdXlJZ0JHMURhaWtSUlZFaUVjdHVZTExsOVlzNUlicGg3bDQwbTQ2TzdyWXNtOEd6Mjg1aThBNlZDVjgxSmFTdENvYXlnVGcvVThOeHJkMmpCVXBGeUdya0lnRmhLRmg3YmJKL1BlbWNYUzBUZ0FqVkNVRDR0RUF0YVpjdFZRaERIVHNpQWc0Q0d4ZGtaVnkxNG1xWUl3V3kxSFJGNGlBYTRwcmc4dW5GSFhUTUNJQ1ZtTWFOUkFRaFZKemFWWEk1Q0pjT2EyRjY4N2R4Y25PMy9IeXRxbTg4cHVwcEJJV1Yyd1pqZ1VDdFdOR2hCa1JpU01nS3FWQ0xYUmxJOXd6Znp0UDNyZUQyWmRjekx3RlYvUHNOL2J3MEpJdFpQcGNiS25ENmEvZ2lMb2p3a3crMElnaVpUZjFGUnpPRzNlY3IvMTVDMC92dTRkSGYxdEhZQTMzVEwyS2g1YXM1bGZ2dDdKMTMzalNDYi9jNzZpcUdha01MRU1FSFRqTWJHN0hOMmV4NXNOYVBzeTMwT0lkNFBFRDR6akJUSzQ0cDVVd01BT2JSQWd0a1JFQmszZmN2QXh4bTNJeUZ5ZG1NalRHQkd0amhKcWtNU2FrekFsTzlzYkt2WEIvQjJZZDAvc0h1V250ckxrTFRUNnoxRVlUNzNpcDlDK1hibmkxdFgvdHZZVUxSaytjY05ta3RtaTZqRDRWQzlqd3dRUU9ITjdOSTVldEk3MzFjandic3VxOHArazR1cHVYM3J1T2VNd2ZpQ2VGZXI4dy9vbTU4OGN1ZjNOOU9mSDl3NXlybWlJOVhkZVl3TTRSVmVXNUJUYzJ4SSszdisxNDNoUnJCT3U2bmFIcmJrQ2t3MkRIMW1YN3psODcrYUxtWnliUG9NclBvMUlNNFV3dXdsa05YWHhuMmR0TWF3cko5QjNndzRQZHJQcTMyZXhvYWFJNlZVQnRrWjFleCtISzdpUGMxblh3Y0NZUzM0V1lOcU9hdHFFL0Yyc2JVUzB5NHhWNnJveUhRVk0vcmE3djE1c2dXTlNmcmRUM2NXd0lVanBwUUZFcnBCTWVIM1hVY3NmM3IyWHFxSS9vYUhmWjFUcUd2QitqT3VsaHRSUkZHQVNEZzhVR3RnbGJhRUxBRmhORXlhSVV3YmhxemtiRlZTbmRTcVFzUEMzTlFVNFlEQ1M3VWxTcENzbVlEK0t5dmJXSjlvTlpFbkdsT3VGVHpJOERqVG1xUksxRlJBZUZndmF2RGdoWTFZYUlLc01NbDRxUUNQM2lYK1RVUHhsUnF1SSs2VVNBSXhZcmxXTXhWaHB2OUhUUnBJNnpSMUR2ZEVxUEIzN3BHZVNVZU05NUxzZDZvcHpzanREclJTcUdxS0xFYkZoeTgybWlLVXBrdjJENkVKdXFsRnlzUUNMMGNiVElVait4UnFBN0YrVUxqU2Q0WU9GMnVqcDI4OHptTDdDcmRUdzFLWi8rT1Y0QlI0VzRoZ3hMaTViQTlLYmpIZEZ1YzhMNHRyRVNjTVdRQ0R4YzY2T1lVbXFIM3J6TEJVMUgrTkhLUGJUTDVZVGhORmJjOERPV1BlTHoxcDZKcEpNaHF2MWdMSWt3d0E3U1kwVTNaV2RPTzY1R2hqMHBVQkdTZm9HSTJxS2dTNVhQODVWN3I5N0xCOTdWTEhyOUl2NWl3L1VjMFB0NGNORStWSlZRQnlUc29LU3NYMWxQeFlhcENPYnViei9xaTVqVzRjQ0VJaVFDajBUZ0VZcVVxN0JyTEExVnNQTmtQZnV6bmV6UEhlRjNYVTAwVkR1NFRvQzFSWWRhRWFJYWtyUmhLWkFyWVpFQnJha3hId3hYeGxTRWVPQlQ3UlhLV2NFUkliQVJYdDVSeDIxVE52RGdPVWtlT0R2RjRrbFA4c0k3Q1FwZWpJaFRiUE5DaEdRWWtEaU5nRlVHbFFQZmxaMHhoZy90YUJpUTl2TFkwbUN2S05XcGdQLzY5YmswcEhmd3dNeC9wNmQzSDQ4L2EvbW5seTRoblFwTEFoYXNRTkwyZ3htMlJ4a0EwNWV1M2hydHpXZU0yclRLcWN5NDFqS3FrRUZsZ0Q1SExERlhlUFRsaS9uWFg3WnhyTTJodldjVTZVU0lhMnlaQll0UUZ4U0lhRWhlbk1xUEs0NHRXMTcycTFlUHF1UHNySlNTdEhqZVJrTTJ3MkNnQ2hpalZDZDl1cjFxVHVicXFFbjZPSTRkWWtXQitzRERXSzNvSmxHd1JscUdxTVRHb2h1R2x2MUJhd2hqK3JxSjJ1QlVnd0l4eHhKM2d3RUJEUG80S0dPOExGcmhXS20vdktnNGJ3d0ZFNG1zdHlKNnltT3A0anN1OWRiYjdFTFBjT3lkMG9IMXN5ZmthMXkyaGtZcXJtTU0xblZmR3dLbXI2WitreHFuaGQ5RG8wQTJuZjdCblcrdnU4TFZZRitsdENVVmp0UDZjMHhNdFhQekQ1NllIU1pTRDZ0VXNPNll6dWpveGcxRHdOeit5czl6TmhKNVpTakxRaENMdm5ubmUyL2RCMmhNZE0rQXVkTWYyL2E3TTRMZHUyVldzLy9sN1Z1L1lTUFJsMlRRWGxIQU9CdnZmLzJGdzZka2xxQSs5Wi9xT0NxbHVtS04yRUk2K2RXdTB1NklPSnVORHBULzA3dEpFU3lPa1UzbFM3VzFYMVhIZVAwYjFBaldqYTJwMkFOSGw2OSsxeHJuTlMwMVZqWWFlZVdXVFcrK1UxNG4yR0pFZzhIOXBKUTRrRUdBWkdERXdSSFozUC92MVJ2WDdjYUovazlwQ2tRZGQyZFBYZnkxaW1CdVdIR0QrbFZWMzdWTzhlUlNZOG5uQjYrUGRiSy9GYUZkTWZTNk1US1JKRDJSQkpsSWpJd1RJZU5FNkhGY2VrMEVpK0lZa3gxZmw5ZytkQ0IwMWhaUElBMFNTL3pqdDlhdDg0ZWRteFp0ZnVNWEwweS85QmQ0K2V0OGR4REZ3RS8vK2VIc1pmZisvU3BjWnN4djNYbGZ4Q3VreFRqa3ZBSnQzU2ZMckZqalpIZlhqZnVoSDNOM3ZmWDBEOXVHdmh1cTNrSjdWbkhjYmZGNWYvZkVKNzQ3ZU83eUJWT2RYTzlUWG4zanRVdGVmN0g3MU5lMXlkcU5RZk1CNHdkMVJneFpsUDFHS0hlVlJuSVhSKzJGMDNmdDJmdjdXOTg0dU5HOGY5UHFiUnFOcmZ6S3U1czJmZUxjdFBqWDYvYWRtRGpwMW13eW5xMjAvclBhbVpkazNGaE5UeXhKSnBxZ0p4S2pWMXd5VHVscjNNUTZwK2JTU250YnZ2a2t3ZWltV3dZRCtjVHg5aS9YUHRNeTNGb2lsLzhUUjlVSVlGQmNCRmVLQmErL0UzU01NN0hTM2hVL1dtT0J2U1B5SXVQNzB5K1Ziais4SmhzRzlJVUIyVEFnb3dGZDF0SVZoblNIeGQvalFmN3FsYmN2VC82aGR2OFhrQkZ4bzNlNDVnY0FBQUFBU1VWT1JLNUNZSUk9Jztcblx0Y29uc3QgYXN0ZXJvaWRTb3VyY2UgPSAnJztcblx0Y29uc3QgYXN0ZXJvaWRGbGFtZSA9ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQURJQUFBQXlDQVlBQUFBZVA0aXhBQUFBSEhSRldIUlRiMlowZDJGeVpRQkJaRzlpWlNCR2FYSmxkMjl5YTNNZ1ExTTI2THl5akFBQUVvdEpSRUZVYU43Tm1ubVVYR1daeG4vdmQrK3R0YnQ2NzNTbjB5RmJoeVFFRWdKRU5zWElJb3ZFQXc1SE9Dck9qQWZVVVhSUVFYRlFjVVFHWndROU9vQXk0aktNb2lMZ0FXV1JuU1Fha0VBSVcwZ0lDZW51OUY3ZDFWM3JYYjUzL3JnbGc3SVlFSFR1T2RXbnF2cWVVOTl6MytWNTN1ZjdSRlY1TTY1ZEJWSU52L2lmdzd3bkhqdkJmV1p3WDBaTEkwR20vYWZORDF4eno0dnZtN25xcDlMNDBkUC80a1hJR3dtaytJMGZkdGwxZDc5ZHhuWWNaUkxWUTAxRE9OODQ1VVpxZ2RISkNEdmtGYW0yM1dvNys3N1c4TmgxandBVVR6OS9OdVhDNFRxNis0bkdqYmR0L1pzQ2lXNisvM0IvdzhZTHdrMGJqMkhuVXlteGVaeDBoTnNNVGhlWURvR3NvdE9XOEVtUGNEeFpWZVAwcTBrL3dwb0ZQNUtOa2FmNWlYT2Rsc1lmcEI2OTk3Ly8ra0EyREdTcTkvM3lNN3J6eVgvV2JRKzEyTEhua1ZCUlBDUmhNRjZJMHh6aTlRclNEcVFzV2hSc0JXanlJVzNSc2tUUmVNY0R3YmJWSlU4bUQweWU5cmJqK05RWG5ucXRTM0ZmTHdaOStMRWphdHVlL29HZHp2ZEpiUXJUM1lOTmRoQU1Ua09oREY0R2NRV3pjeGpkVXlDeHJ5S3pCWm9VcHoyRU5oODZBL0J4NUpteE5mYVpqZGorTm9KTnV5N3o0SVRYdWg3bm9vc3VlbDFBU2c5dk9TRW9GSHpiM0hCWGVPQVI3VUgzb25Za2lhbUZVQzFpYWdVOHgwZlVFazJHaUNPWURrV2JRaVFUUWlKQ3N3b1pBNDdGU1JXeHp3V0V4WTYyYWlaWlNxNVkrdEJmSlNJTmE0KzdHcmdhWU9yR0d4ZXlmc01TV2JjT1J5ZVJwaEIzbHNWcERsQlhDRWM4ckNmWTJUV2NaV1ZVRktvQ3JvRXVSWnBDVEZJd1FaSHFnenViZzk5dVdzRUhUbm5odC94YjczYUIxc1NKUjQrK1lVQUtpMDdiMzdVenM5eFRaNmE4M2txMitrRHJ4OXduQjljNjFVSE1ITVZwU3lKcFJSSWcxaUdhRVNScmNackJFUWRLRHFSRHBGbWhHN1FkbUFaTkFzMFJidk93QkJ2dTdmbWpaaEw0RHZueFZkWC91T3lnMUhtZi91cGZWT3lGRmU4NXpLdnN1dGpySG4rYnMycksxYlJEc0NtTlRsUnhsMVJ4bDFna0RRU0NHZ1VGUmhQb3FBY3BpMmxWeUNoa0FralgwRGtSSENyUXF2QWNNQUt5elNHOHU1SHErczZucXllZGRITDdkeS9mOFVJcVgvaXY4L0dyRHpDVHZ5SjcxWGN1L2RQMW1UOEhZSHJsY2F0S0RjdC9ucHJjZEU5eTZhNTN1SWZuWFZvRHFQbDRCMCtTT25NYTc1QUFTUUJpMFo0cUxLd2lzNnJJUGlYTTBncW1XMUVQMUVhb0NTRWRJUzRRS2lTT2hPNzNnUWZrSXFRcnhHbkxWTVBlWTZQQ0RaZTNseS81MG40QVhuUDNnRkgzUWxIdmN3QlQ1MXp3cnNtTHJrM3NWVVJLQngvNzkvcmtzNWNaTGJZbURnSXpUNGxxZ3ZxQzJ4cGkya00wNzhDQUJ6VURYU0Z5MUF5NjNBZGZrRkhRU1lVWkQ2a2wwV3dBN1RXa0FVaUN6Z1AyK3pyd1B0aStFamFQb09zYnFOMmV1eU85ZmZENDBpSHZ1RkNEeW5zYU52L3VRSUNaVDF6WUNmWm1jV3VUa2lnK2FuZjBEelJlZit1VnIxb2oweWQvWUQremRmdFhwVnB1bFY2RFJZbDJHR3hGRVF2KzloVE9qSWZ4UVZvRFpIWUVqUkdvUlFDZHAraVNERG8rQzdZV2tmd1lraExJZ0tZQkM0d0RNeitHaHNmQUx5QkowQUNZZHZlZlNxNDVQdEd6NXlkcTNLOU1yejFtQzI3aktia2JiOW94K2ZYdmZpa3hNWHk3azNhUE0vNVRqd05Ydm1wcTZlWW52eHRXeXQyUm81Q0RhRVlJZGhqQ1p3MWh3Y0VtRFhhT0E0ZGE1SmdBT1g0YU9hQUVqZ08rQTFWZ1dwR3NoK3pqUVJ1UVV0U1YrUEUxQVNMb3dLTXdkQzJNVjZFaVNJUEZwR3V6RTNiWEQ2MTBYaUxOTm5MNnQvU0pDVDhDa0c3cjJPZzBkL3c2dW11VDBhSCtKWVZsUjU3OGloRXBuZmFocTJ5eGVKQllSNXpsS2N5eUxKRm1vWlRIaE5PNDdSYXZPMEs2S2tobkJDblFsRVd5RVhpZ2tjSU1pRjhGWnhzWTBCUklSWkEwYUZMQWdnVEFBSkFIOG9JT09raVQ0QjBTSXNueXJMQi8yM3RKQ2M1K3JnbkdCbGNBcFA3aDFFTHQ4dTk5UWFlRGt5UVlTcmpMRDdyVXYzbEQ2WThJOFM1cE1KMlJ1ZFE3OU9DenZZTlhwYjNEOWlzNmZVbEhKMGVNak9WeEtKSHNFYnh1UlZwQkd1TmNKeGtpNlFEMUl2QXRrZ2VwQ2FRVmRldVBLeFNrVXIvZlVhUUdoQkRuSVVqRmdhRVVpQ0N1UXVnaGN4UlZoV2JFVGxkYWE5Zi9hano1L2c4K092UEJMMDVUcXpXYWNPcFFkMkZMbTUxdW1XV0tsM3l6TjcvcW1DOU5kUzEvK21Bdk94cmQ5S3ZQaEk4OWtXYnVuSnZNdTA1NWYvVE1uajFzRzRmQkdad0VtRlpGMnhUYUxEU0ZhSzRLSFZXMExZUUdJQ1dvVTEra0ZjZ1oyTmZBU3RCMlJXdUtWSUVJTkNYZ0NNd0FaVUFONGp0SVJqR05FVTZid1R2U1lySWhSdjBXR2R6NUdZQ1diYjhxTzh1Vy95aUtXckdsQ2FLWjBZVFI1d2VQOXpyYUYzbHZQenhGYzF0Z3k5Vi9yMzd6bWxObWJuejIwOUhGLzNpMkdYbXFHOStpbmdkZEZ1YjcwTzFEY3cyYWFraGJEVHBDcEFVa0F6UUNjNERaUUF2UVlTRm5rVm1DckV4RFZ3S0Nlc3NVUlh5UW9rQ29TQ2IraDFxRHRFUXdMUmdCZDJFQU9VVkwxYzdLVVlldkJmQzNidGtXcHJ1ZUNDZFNOcHpmZE5jcnR0L3c4NmV2azRuMVI5anBra1M3SGR3V2c3TWdSRG9DRkF2TlBwSU40OVRJQ2RwS0hKRU1rTkQ0KzliNnkzWUNDMEZhb1RBQXU3Y2dVd28xUWNjVm1aYVlMRlZnSkFsVEhsUU50aitCRFEyeU1DQjQxbUNIVE0wT3QxemJzR3ZyV1pNZHl6TUlQeVBsem1uWnZmbkFseTMyd21sbm5wdmNzV21GMjFjU1ZIQTZ3WmtUUUZzSXFRQ1NFWFJHMENCb09WNjBDa2hPWXpCaFhCODBBUndOWEFaVVFIOE51VFRTbDRmQmZuUjduRkpxUVJ3Z3A1RDBVVlhFVHlGdGlobXlSRHM5c0JaM3ZrMkVpZW9xQUx1bzNTTHBuVTVueDlRcmRxM2RIL25PMVgxbnJ6NlRuWW1WcHNOaTJoV1NJSTVGVXhHeU1JTGVldEdXSmRaSlhYVVFBV0Exam93MGd2MG5NQ3NRQWxDRDZqdzBMVEMzSDZZVWRodkVDa1FXRFVHYUxmZ0JsRnpFdXRDdW1ES29JNWhzSk41Q3YzdG96dC8xSkw3MStXRjVkTk9UMnRJNng3L3lKd2tYWU94ZkxuRWJjMDJaWUhqS05PN2VVOWovaGl0S05TZFJjNm9HQ1MwYUNJeTZzYnlZYjlGdVJUeUpkVlZXWUxiRk5IV2pPajhHTEVYUW5TaWZSTXlwY2Q3amdheEdaRFdxU3lDeEhYbzN3K01HSmwxSTFSQmYwVWFKQldVMlJJTUFXZ1hUb3FqdmdLOUlHT1Z5UFUrZmtUMzF1Sy9uSFhzZHY3enR2NmFLcGM0NEl2UG11TFdyci91K25SaGJVMWg5MElmdG9lODVOalV4dFQvN1d6UUg3SEpqbnVoV3hJdjFJREdKUTlaQ0pvZHlIS0tIb2RJYUswQW1nRDlJY1VXUUY4WDhDT0N6MEhnbTJoNGcvUVl3YU5iR3hObWk2TzRRTFRxWWhJRk1nQnNaN0dpQ2FGSVRqaTBmRHVCY2QvME1jUEhBSFhmdWNRRTZ6anF6T3ZtMUt4NWlhT3drYytmOTF6djVHZHl1QU9sVmlBUWRGYVJad0xPb0V4ZWxlaUN1b3FiT0F4Z2dBUXBLR3VGdFlCYWpkYXI0SThrdEFDZWltVE9ScGRlZ3BTRHVkb3RBWm9OT0NkSnBvUlRGYWRwb3dZdlRUU2N3ZG5mUWJSOC92YS9wWXdNMTNycis4VlV2bGloYTlrOXd3bWxQcHNjd1hvaVpJNUFMMFZraDdCL0M0Z2pOUlZBRHFncFNKN3NDTURHTlJyZUQ2VWRJQUI0cVBRaXBPZ2g1cVFRaWgvSjJ0QnRZcnNnU2tQbWdEUnBMbVU1RjJnSzBJVUJURm0ySitVU01HaTBsNS9KUTZReW1ocnRmSXVOMTBjS2QwZEplNjh3MU9JdkJkQ3FxQmp5TExLdkJBU1hNckJBSlFmSVNhNmtxTUdsaWlSR09vT3dEOGxaRVU0am1YMjNpUndCaEx1SzBRVE5vcTBJQ1JPdXJTb08yS05KZ2tZVEdzMDQ2d3FTdDJLck85bThybm9mVjBrdUFtQWQrY1c0NDc1RE4wYlFUdVowUkpCVkpXTWdGYU1hSGpocmFvV2hhNDNTcFNCeU5zVHFMTzhjaHJBRnBSYzFiVUptM0YrTmFPN2p6NDdwb05QQUhUbk1FakVBV2FMZlFHS2V3cXRTMVhCbi9OODhVZVBlVno3NEVTQXNVZEd6aUV1dW55cmJpUU5tQlFPb003c01zQ3gweCtVbGpuRllTeFdwVlp3SHV5Y0RjZWczc2cwalhYbmhSaldBNjQwNW41cU1xY1NPeGRXTElBbTJnalhGaFNjMUFSUUNpVU5MYjRKM1ZsNTBRRzYrOThpNTFNbFArczRvTmJFeHNDRFJaNkFKcFVHaFd0RTJRTmxCWDR4L0o5cUFjK0RvOHBReHdCdkNwbVBuUldIT1ZnQnhJWjEzeUdKQXFhTWtoS2hnVVU5Wk04MysrNHFpYlhqUzdTSlM1Z01CTWs2NjNWZy9vRWFRNWxoK1NxYi9QQVEwQ1RTRGVJTUl1VkhuUnE2NWNsYmhQYTFUdjIzKzRBakFlWXRZaWNnNHFpMk5wWDR6bHZUU0NObW1zR0h6UXNzRk91b1NUS0hqOWJVT2JibnpWbWIycDhQQ1BwZFBiU290VmtoWUpnYVNpaVJmNkpyaWdTVVViRlZJbXZpYzZIN2dCWkFia0ZsUlBCdHVEdFIvQjZsQ3NRZVQvaWgzOGVqZkxvZElGMGdDV3VCWWFGRHlOZ2ZrQ05VWHlCanZrWUdkTTFTWlN0K3lWSFJRR3FlZVRVajZRVk9SaEZjbkhneEZwUlV1Q05pbVNhRWQ2S3JDbkJPTUNNZ0QydmVBSmFCU25ZUTVFaHNBay80UlBOQmFlR2o4YjBTS3FnekVRRDB3V3RGeDNaSHlGa2tHSHZSaEl6VlREVk11dGUrV2k2R1RtZnBzM0ZaeTRxTFZVbitMcVZvOEVnUDAzMVBzSmVBc2dyOGdJTUJ6QlFJZ01LVEpWZi9EbUlORDJPZ2l0LzQzSlV5UlovL3dnNkcvQmNUQ05vQ0tJQmFrcEZFR21CTHNqUlZnQWFrNXBac0dIZnI5WFFHeEZtKzFPeDJqVjFCY0RZZ1gxUVJJU0YyUjRDN0FXek9ueDA0dUlMWjRBcUVrOENicTUrbkR5cHh3aUNBNFFvQXdEMDRnY0JjNGhnQ0ExUmNzeHd6TUZkc3dqMk9waTgrcHJtTHB2d2FOblZmWUtpUHVXSlNjR095V2pJd2FLSGxJMXNjMFp4VW5CRExEN1pzVC9ITnExR0xRUDNRRmFFeVFqNE5TbEMvc0RiNm5uVkJpakJWUWo5QS9vU1NQTVJ1bEN0Q0YyVVVyQXVDQkRjVnBGMjFORXV3eFM5S1pxTFhNdTIzdkxkSjlPRFRja3NidDluTm1LVGxod1FrUXNrcXlQc21NSzVhOGhDOXJSSlljaWt3SlQyK0p1aG9HYWhjZ2lqbE1QUkVUczk0eUJ2UlRZZ3NwSHdmU2djaS9ZKzlEeUZzZ3JPaUxJc01ZUnFiaEVqM3N3cVpHMlpCN3MzSDN2NXBkYjhzdEdKUEhoTXk2UStmUHo0YVNnUmFEa3dhaUQ3aEVZQjdFS1JwQWk4Tmc0Mk1QUW82OUI1NitNMjNXTDFnMkh6Y0JOZ0VVbENib1I1WDJvWEE1eUY1Z3p3QjREVTE5R3R2MFdIaXZDZG9GKzBCRUhtc0htRGZaWlFVbU5WbGV1K3VKck1yR1RSeDZ4cmhKNDN3K0hFaC8zOGpaalBQdUNldEJTTExVbGErT0JLZ1RaZWpsMGIwRE1US3lLV3hUSmdEb1ZpTDRGY2ovSU5PaG1wRnBCcmFDdUlLRVAwejZNQ0RvdXNRTlRCcDEwMEc2TDhjRGVsU0txdGRTaTFYMjNkTnp6czgydjJZMXZmdjQzbnkxaytwYjVUL3NuSkJESHREajFCaHJBRGdPQklITnIwQnFoMFFRUzNncU5nbVFGeWdvSlFSUlVoc0ViUmtMUXFSaVBVWTA3bUE5TUMxcmdoUUZPSjkwNG9oN1VMbS9DWDllQjM5TThxbXRXWFA2NjkwZUtjOWQ4TXZ2NGJmdnBWSFYrZXJVaU5vRkdnbmdXblVoQTFZRUZaYVExaW9WZVVjRktMTzU4UlpKMUFWakhqMDlNK3lFd2FtQlBiR1JMZzZLZUE2T1ptSU9TWllLcm02bmMyWXptekxTeHBTdGFMcjM0bWI5b0R6SGZ1MnE5REl3Y2tleXJrVm9OcG9sNFR2R0JnaHR2b1MwdXdUd2JtOU11NEVyYzVlcnY2NU1YRXNUeVh5ZUJBWUdpQVMrS04wY3FXVWo3eU5JWjlIY2U1WDl0cG1wYnE5NCs3ZC9MYlYxL3pwK1RiWDkyVzhGNHptYnBicS9XdHFlcGJGVENBVUVIUFNReWlHT3h6eVhSSjdMSW9CUExxYlJBS3JaNnlJT1U2N3hSRXJRZmRCUTBxK2krRnJvaktHU2cwSUN1S0NObnpLQWxxUDJzblZydjZwM214S1BPM2hzUWV4V1JwMFhjbm82bEQ1czFiMTFoZCt6R0tUeUp5Vlp3Wm9HM0pFSVU3SlNKSGZuRkZlZ0xvQ3QyUGFSWVovSUdRUXBBcE9nOEYxcG5RK0RBd0FDTUticklJbk1zc3NIQlB5YzdVWHkwOTh1dCtzUzMzL0R0NlVHUnhTMm5uM1dIYyt6Ulc4SWJicDJRNSs1WnE5VmFtOG1BZDRERkpHSjFhbVlGeUtJUzlNUXp1T2JxWG05QVBFZTBLdlFtUUErQW1RU1VIb1FnZ21tRGJqRDROL1ZTYVg3bkkrSDVaMTdwYmRtOExJenNMOXZQKzlpNk4zU2Z2WHJFMm1YQnFoV0p4bTkvWlhQNXZjZCszSjNaZXJFZHFqU0Z3eTVPaHlJcGNOckFXeFJCVndWdHFrRWlkbDJJQUNOb3J1NG1GaFdxRnFhVE1KckFidmZ3TjNuVVNpM1kyVzJJYTVEWlhRK3V1LzNuaDU4Y2oxbHYzb0dCOHZ1UHVTK1plT29vTFZUd24wZ1JqY1NHWFhLcGtsZ1JRWHNRZDZpYXhJTzRhOEZZdE9JaUJSZENRU3NHV3pCRTQwS3dVd25HSTlSeGZOUFNlbTNUK1ovL0JPZDlvUHltbjN5WTdQdnd3Y25zUGRjbWp4NWU0dlJHaEErbnFUM29Zc2NGZHc0a2wvaEllNGk0Ym13cFdRVnJJS2hMOUlvUVZTQWNFY0xkRUpVU2xzYmNPck93OThMYzcrOVkvMWM5d2pFbUp4NmFPdkNwcTVMdkdsbnBMYXdodXhxSUhrNVQyeEpoTzNLNEM0UkVjZ3FUVUJBRFZyQXpTakNzUkFNTzBiQkRGTHBWVGFadmsxbXpMbXZlc1c3RDMreFF6Ulo1T3JuUDNOTS82QjVVdThDeHRYa01UaE1PUnZnZGZVamZQTnpCNXpCak8zRmJRVkllTmtoaEM5NmVhTng5SUlvYTd3am16YjJ0WTlNTkkvOXZqam5sMzAxV28zTlBOczl2ZWFmMDkvY296Q1dWbm85cVFvdVZzcmp1cUZuUWU3ZFp2UFNIL3V4ek5yWjlZMUg0UnA0UGt6ZnI0RmwrNVpFZHBuL2lOTVV1c04zdGo5amxCOXpaOGRPcnhuaVRydjhGNUZZYnFPZ1dpaTRBQUFBQVNVVk9SSzVDWUlJPSc7XG5cdFxuXHQvL2ZvcmNlIGRyYWdnYWJsZSBmYWxzZVxuXHRjb25zdCBkcmFnZ2FibGUgPSBmYWxzZTtcblxuXHQvL1RpbWVyXG5cdGxldCB1cGRhdGUgPSBudWxsO1xuXG5cdC8vZ2FtZSBlbGVtZW50c1xuXHRjb25zdCBnYW1lRWxlbWVudCA9IFt7XG5cdFx0XHRzcmM6IHNwYWNlU2hpcEljbyxcblx0XHRcdHg6IDIwLFxuXHRcdFx0eTogMTMwLFxuXHRcdFx0cjogNDUsXG5cdFx0XHR0eXBlOiAnc3BhY2VTaGlwJyxcblx0XHR9LHtcblx0XHRcdHNyYzogYXN0ZXJvaWRTb3VyY2UsXG5cdFx0XHR4OiAyMzAsXG5cdFx0XHR5OiAyMCxcblx0XHRcdHI6IDAsXG5cdFx0XHR0eXBlOiAnYXN0ZXJvaWQnLFxuXHRcdFx0c21hc2hlZDogZmFsc2UsXG5cdFx0fSx7XG5cdFx0XHRzcmM6IGFzdGVyb2lkU291cmNlLFxuXHRcdFx0eDogMjMwLFxuXHRcdFx0eTogMTIwLFxuXHRcdFx0cjogMCxcblx0XHRcdHR5cGU6ICdhc3Rlcm9pZCcsXG5cdFx0XHRzbWFzaGVkOiBmYWxzZSxcblx0XHR9LHtcblx0XHRcdHNyYzogYXN0ZXJvaWRTb3VyY2UsXG5cdFx0XHR4OiAxMzAsXG5cdFx0XHR5OiA3MCxcblx0XHRcdHI6IDAsXG5cdFx0XHR0eXBlOiAnYXN0ZXJvaWQnLFxuXHRcdFx0c21hc2hlZDogZmFsc2UsXG5cdFx0fV07XG5cblx0Ly9zbWFzaCBhbmRyb2lkXG5cdGNvbnN0IHNtYXNoID0gKGkpID0+IHtcblx0XHRnYW1lRWxlbWVudFtpXS5zbWFzaGVkID0gdHJ1ZTtcblx0XHRnYW1lRWxlbWVudFtpXS5zcmMgPSBhc3Rlcm9pZEZsYW1lO1xuXHRcdFxuXHRcdGNhcHRjaGFDbGljaygpO1xuXG5cdFx0aWYgKChnYW1lRWxlbWVudFsxXS5zbWFzaGVkKSAmJiAoZ2FtZUVsZW1lbnRbMl0uc21hc2hlZCkgJiYgKGdhbWVFbGVtZW50WzNdLnNtYXNoZWQpKSB7XG5cdFx0XHRnYW1lQ29tcGxldGVkKCk7XG5cdFx0XHRjbGVhckludGVydmFsKHVwZGF0ZSk7XG5cdFx0fVxuXHR9O1xuXG5cdC8vbW92ZSBzcGFjZXNoaXBcblx0Y29uc3QgbW92ZVNwYWNlc2hpcCA9IChlKSA9PiB7XG5cdFx0Y29uc3QgcmVjdCA9IGUuY3VycmVudFRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0XHRjb25zdCBtb3VzZVggPSBlLnBhZ2VYIC0gcmVjdC5sZWZ0O1xuXHRcdGNvbnN0IG1vdXNlWSA9IGUucGFnZVkgLSByZWN0LnRvcDtcblxuXHRcdGdhbWVFbGVtZW50WzBdLnIgPSBNYXRoLmF0YW4yKG1vdXNlWSAtIGdhbWVFbGVtZW50WzBdLnksIG1vdXNlWCAtIGdhbWVFbGVtZW50WzBdLngpICogKDE4MCAvIE1hdGguUEkpICsgODU7XG5cdH07XG5cblx0Y29uc3QgZHJhdyA9ICgpID0+IHtcblx0XHRnYW1lRWxlbWVudFsxXS54IC09IDY7XG5cdFx0aWYgKGdhbWVFbGVtZW50WzFdLnggPD0gMCkgZ2FtZUVsZW1lbnRbMV0ueCA9IDI5MDtcblx0XHRnYW1lRWxlbWVudFsxXS5yICs9IDU7XG5cblx0XHRnYW1lRWxlbWVudFsyXS55IC09IDM7XG5cdFx0aWYgKGdhbWVFbGVtZW50WzJdLnkgPD0gMCkgZ2FtZUVsZW1lbnRbMl0ueSA9IDE5MDtcblx0XHRnYW1lRWxlbWVudFsyXS5yIC09IDM7XG5cblx0XHRnYW1lRWxlbWVudFszXS54IC09IDM7XG5cdFx0Z2FtZUVsZW1lbnRbM10ueSAtPSAzO1xuXHRcdGlmIChnYW1lRWxlbWVudFszXS54IDw9IDAgJiYgZ2FtZUVsZW1lbnRbM10ueSA8PSAwKSB7XG5cdFx0XHRnYW1lRWxlbWVudFszXS54ID0gMjMwO1xuXHRcdFx0Z2FtZUVsZW1lbnRbM10ueSA9IDE5MDtcblx0XHR9XG5cdFx0Z2FtZUVsZW1lbnRbM10uciArPSA0O1xuXHR9XG5cblx0dXBkYXRlID0gc2V0SW50ZXJ2YWwoZHJhdywgMTAwKTtcblxuXHQvL0dhbWUgY29tcGxldGVcblx0Y29uc3QgZ2FtZUNvbXBsZXRlZCA9ICgpID0+IHtcblx0XHRtbERhdGEuZmluaXNoVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdGRpc3BhdGNoKCdjb21wbGV0ZScsIG1sRGF0YSk7XG5cdH07XG5cblx0Ly9jb2xsZWN0IGNsaWNrc1xuXHRjb25zdCBjYXB0Y2hhQ2xpY2sgPSAoKSA9Pntcblx0XHRtbERhdGEubW91c2VDbGlja3MgKz0gMTtcblx0fTtcbjwvc2NyaXB0PlxuXG48c3R5bGU+XG46Z2xvYmFsKC5hLC5jKXtmaWxsOm5vbmU7fS5he3N0cm9rZTojNzA3MDcwO3N0cm9rZS13aWR0aDoycHg7fS5ie3N0cm9rZTpub25lO31cblxuLmdhbWUge1xuXHRoZWlnaHQ6MTAwJTtcblx0YmFja2dyb3VuZC1zaXplOjM1MHB4O1xuXHRiYWNrZ3JvdW5kLXJlcGVhdDpuby1yZXBlYXQ7XG5cdGJhY2tncm91bmQtaW1hZ2U6dXJsKFwiZGF0YTppbWFnZS9zdmcreG1sLCUzQ3N2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyNTQuNzMyJyBoZWlnaHQ9JzE0Mi42NScgdmlld0JveD0nMCAwIDI1NC43MzIgMTQyLjY1JyUzRSUzQ3JlY3Qgd2lkdGg9JzI1NC43MzInIGhlaWdodD0nMTQyLjY1JyBmaWxsPSclMjMyNjEzNmUnLyUzRSUzQ2cgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTMuNzk5IDguMzI2KSclM0UlM0NnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDY2LjcyNSAxNi4xNTcpJyUzRSUzQ3BhdGggZD0nTTYwMC4wNDIsMjYxLjg4M0E0Ni44NDIsNDYuODQyLDAsMSwwLDU1My4yLDIxNS4wNDJhNDYuOTMsNDYuOTMsMCwwLDAsNDYuODQyLDQ2Ljg0MlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC01NTMuMiAtMTY4LjIpJyBmaWxsPSclMjMzMzExNzgnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNNjM3LjAzOSwyOTIuNTc4QTQwLjUzOSw0MC41MzksMCwxLDAsNTk2LjUsMjUyLjAzOWE0MC42MTYsNDAuNjE2LDAsMCwwLDQwLjUzOSw0MC41MzlaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNTkwLjE5NyAtMjA1LjE5NyknIGZpbGw9JyUyMzNhMTU4MCcgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J002OTQuNTQyLDM0MC4yODVBMzAuNzQzLDMwLjc0MywwLDEsMCw2NjMuOCwzMDkuNTQzYTMwLjgwNywzMC44MDcsMCwwLDAsMzAuNzQyLDMwLjc0M1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC02NDcuNzAxIC0yNjIuNzAxKScgZmlsbD0nJTIzNDQxNThmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTc1MS41MzQsMzg3LjU2N0EyMS4wMzQsMjEuMDM0LDAsMSwwLDczMC41LDM2Ni41MzRhMjEuMDcyLDIxLjA3MiwwLDAsMCwyMS4wMzQsMjEuMDM0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTcwNC42OTIgLTMxOS42OTIpJyBmaWxsPSclMjM1MjFiOTYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDL2clM0UlM0NnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDApJyUzRSUzQ3BhdGggZD0nTTExMi40MTMsOTIuNDExQTE3LjYwNiwxNy42MDYsMCwxLDAsOTQuOCw3NC44YTE3LjY0MywxNy42NDMsMCwwLDAsMTcuNjEzLDE3LjYxM1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC05NC44IC01Ny4yKScgZmlsbD0nJTIzMzQxMjcwJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTEyNi4zNCwxMDMuOTY2YTE1LjIzMywxNS4yMzMsMCwxLDAtMTUuMjQtMTUuMjQsMTUuMjYsMTUuMjYsMCwwLDAsMTUuMjQsMTUuMjRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTA4LjcyNyAtNzEuMTI3KScgZmlsbD0nJTIzM2QxMjczJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE0Ny45NTgsMTIxLjlBMTEuNTUsMTEuNTUsMCwxLDAsMTM2LjQsMTEwLjM0MywxMS41NzMsMTEuNTczLDAsMCwwLDE0Ny45NTgsMTIxLjlaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTMwLjM0NSAtOTIuNzQ1KScgZmlsbD0nJTIzNDkxMjc5JyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE2OS40LDEzOS42MDhhNy45LDcuOSwwLDEsMC03LjktNy45LDcuOTIxLDcuOTIxLDAsMCwwLDcuOSw3LjlaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTUxLjc5MSAtMTE0LjEwNiknIGZpbGw9JyUyMzU1MTQ3ZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0MvZyUzRSUzQ2cgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTkxLjc3NyAxNC45MDUpJyUzRSUzQ3BhdGggZD0nTTE0MTguOTUyLDE3Mi45YTYuNjUyLDYuNjUyLDAsMSwwLTYuNjUyLTYuNjUyLDYuNjYsNi42NiwwLDAsMCw2LjY1Miw2LjY1MlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xNDEyLjMgLTE1OS42KScgZmlsbD0nJTIzMzQxMjcwJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE0MjQuMjQ5LDE3Ny4zMTRhNS43NTcsNS43NTcsMCwxLDAtNS43NS01Ljc1LDUuNzc0LDUuNzc0LDAsMCwwLDUuNzUsNS43NVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xNDE3LjU5NyAtMTY0Ljg5OCknIGZpbGw9JyUyMzNkMTI3MycgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNDMyLjM2NywxODQuMDM0YTQuMzY3LDQuMzY3LDAsMSwwLTQuMzY3LTQuMzY3LDQuMzgsNC4zOCwwLDAsMCw0LjM2Nyw0LjM2N1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xNDI1LjcxNSAtMTczLjAxNSknIGZpbGw9JyUyMzQ5MTI3OScgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNDQwLjQ4NCwxOTAuNzY4YTIuOTg0LDIuOTg0LDAsMSwwLTIuOTg0LTIuOTg0LDIuOTg4LDIuOTg4LDAsMCwwLDIuOTg0LDIuOTg0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTE0MzMuODMyIC0xODEuMTMyKScgZmlsbD0nJTIzNTUxNDdmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQy9nJTNFJTNDL2clM0UlM0NnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDE5OC45OTcgNjUuNDg4KSclM0UlM0NwYXRoIGQ9J00xMzc3LjQzMyw0NzAuMzhhMTAuMjQsMTAuMjQsMCwxLDAtMTAuMjMzLTEwLjI0NywxMC4yNjMsMTAuMjYzLDAsMCwwLDEwLjIzMywxMC4yNDdaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTM2Ny4xODUgLTQ0OS45KScgZmlsbD0nJTIzZjY2JyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTEzOTEuMDc2LDQ0OS45YTEwLjI0LDEwLjI0LDAsMSwxLDAsMjAuNDhjLTEuMDMzLS4yNzctMy4yLS40NTEtMi44NTMtMS40MTIuMTc1LS40OCwxLjU0My4xODksMi45LjMwNiwxLjgwNS4xMzEsMy43LS4yMzMsMy45MTYtLjgxNS4zMDYtLjg3My0xLjg2My0uMjkxLTQuMzY3LS40MjItMi45NjktLjE2LTYuMzc2LTEuMDMzLTYuMjg4LTIuNDE2LjA3My0xLjA0OCwzLjA1Ny4zMDYsNiwuNTY4LDMsLjI3Nyw1Ljk1My0uNTUzLDYuMTE0LTIuMy4xNi0xLjc3Ni0yLjczNy0xLjMyNS02LjA4NC0xLjQtMy4xMy0uMDczLTcuMS0xLjEzNS03LjIzNC0zLjAyOC0uMTQ2LTIuMDM4LDMuMDU3LTEuMTk0LDYuMDg0LTEuMjUyLDMuMDU3LS4wNTgsNS45NTMtMS4wMzQsNS40MTUtMy4wNzEtLjI5MS0xLjEwNi0yLjExMS0uNDA4LTQuMzY3LS4zMDZzLTQuOTkzLS4zNzgtNS4xNjctMS4zMWMtLjMyLTEuNzQ3LDMuNzg0LTMuNDA2LDUuOTM5LTMuNjI1WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTEzODAuODI5IC00NDkuOSknIGZpbGw9JyUyM2M0M2Y1NycgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xMzc3LjM0OCw0NDkuOWMuMzM1LDAsLjY3LjAxNS45OS4wNDRoLS4yMzNhMTAuMjUsMTAuMjUsMCwwLDAtLjk5LDIwLjQ1MSwxMC4yNDksMTAuMjQ5LDAsMCwxLC4yMzMtMjAuNVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMzY3LjEgLTQ0OS45KScgZmlsbD0nJTIzZGY5OWZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQy9nJTNFJTNDZyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSg3Mi4yNzEgMzQuMzM4KSclM0UlM0NwYXRoIGQ9J000OTguNzI3LDI0MC4zNTRhMi4yMjcsMi4yMjcsMCwxLDAtMi4yMjctMi4yMjcsMi4yMzYsMi4yMzYsMCwwLDAsMi4yMjcsMi4yMjdaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNDk2LjUgLTIzNS45KScgZmlsbD0nJTIzN2MxMzcwJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTUwNS41ODksMjM4LjMxNWEyLjIyOCwyLjIyOCwwLDAsMS0xLjIyMyw0LjA5LDEuNTgyLDEuNTgyLDAsMCwxLS4yNjItLjAxNSwyLjIyOCwyLjIyOCwwLDAsMSwxLjIyMy00LjA5Yy4wODcsMCwuMTc1LjAxNS4yNjIuMDE1WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTUwMi4xMzkgLTIzNy45NTEpJyBmaWxsPSclMjNiZTIzODUnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDL2clM0UlM0NnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDExMi4wMjQgNTUuOTgzKSclM0UlM0NwYXRoIGQ9J003ODQuOTQyLDQxNS4yODRBMTUuMzQyLDE1LjM0MiwwLDEsMCw3NjkuNiwzOTkuOTQyYTE1LjM3MiwxNS4zNzIsMCwwLDAsMTUuMzQyLDE1LjM0MlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC03NjkuNiAtMzg0LjYpJyBmaWxsPSclMjM2ODM4YTQnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNODA0LjE2Nyw0MzEuMjM0QTEyLjA2NywxMi4wNjcsMCwxLDAsNzkyLjEsNDE5LjE2N2ExMi4wOTIsMTIuMDkyLDAsMCwwLDEyLjA2NywxMi4wNjdaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNzg4LjgyNSAtNDAzLjgyNSknIGZpbGw9JyUyMzc5NGRhZScgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J004MTkuNzE4LDQ0NC4xMzZhOS40MTgsOS40MTgsMCwxLDAtOS40MTgtOS40MTgsOS40MzMsOS40MzMsMCwwLDAsOS40MTgsOS40MThaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtODA0LjM3NiAtNDE5LjM3NiknIGZpbGw9JyUyMzllN2VjNScgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J004MjcuMTUxLDQ1MC4zQTguMTUxLDguMTUxLDAsMSwwLDgxOSw0NDIuMTUxYTguMTY2LDguMTY2LDAsMCwwLDguMTUxLDguMTUxWicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTgxMS44MDkgLTQyNi44MDkpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDL2clM0UlM0NnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDQ0LjEzNCAxMTQuMTIpJyUzRSUzQ3BhdGggZD0nTTMwMy45ODQsODg4LjE0N2EuNzU1Ljc1NSwwLDAsMSwuMzkzLjFjLjExNi4wNzMsMTMuOTc0LTcuNzczLDE0LjA0Ny03LjY1NnMtMTMuNjI1LDguMjEtMTMuNjI1LDguMzdhLjguOCwwLDEsMS0xLjYsMCwuNzkuNzksMCwwLDEsLjc4Ni0uODE1WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTMwMy4xOTcgLTg2Ni41MzEpJyBmaWxsPSclMjNmZmMnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMzA0LjkyNiw5MzQuOTUyYS42MjYuNjI2LDAsMSwwLDAtMS4yNTIuNjIxLjYyMSwwLDAsMC0uNjI2LjYyNi42MzEuNjMxLDAsMCwwLC42MjYuNjI2WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTMwNC4xMzkgLTkxMS45MDkpJyBmaWxsPSclMjNmZjYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMzA1LjgyMiw5MzYuMzQ0YS40MjIuNDIyLDAsMSwwLS40MjItLjQyMi40MjIuNDIyLDAsMCwwLC40MjIuNDIyWicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTMwNS4wNzkgLTkxMy40NDcpJyBmaWxsPSclMjNmYzAnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNNDI1Ljk0Myw3OTYuMzcyYy4wMjktLjAxNSwyMS4zNjgtMTIuNDE2LDIxLjQtMTIuMzczcy0yMS4yMDgsMTIuNTkxLTIxLjI1MiwxMi42MmMtLjI5MS4xNzUtLjQwOC0uMDg3LS4xNDYtLjI0N1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC00MDcuOTUxIC03ODMuOTk5KScgZmlsbD0nJTIzZmZjJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQy9nJTNFJTNDZyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSg3Ljc3MyA0LjA5KSclM0UlM0NwYXRoIGQ9J002NDEuODY0LDExMS4yMTNhLjM2LjM2LDAsMCwwLC4zNjQtLjM2NC4zNDguMzQ4LDAsMCwwLS4zNjQtLjM0OS4zNTcuMzU3LDAsMSwwLDAsLjcxM1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC01NTUuODk2IC05OC41MDYpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNNDgwLjU2NCw4MS42MjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM3LjM3LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTQxOC4wNzUgLTczLjIxNCknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J000MTYuMzY0LDI3OS4yMjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM3LjM3LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTM2My4yMiAtMjQyLjA1MSknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J001NTQuMDY0LDUzMC4wMjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM3LjM3LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTQ4MC44NzYgLTQ1Ni4zNDUpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNNDIxLjI2NCw2NTIuMjEzYS4zNTcuMzU3LDAsMCwwLC4zNjQtLjM0OS4zNy4zNywwLDAsMC0uMzY0LS4zNjQuMzU3LjM1NywwLDEsMCwwLC43MTNaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMzY3LjQwNiAtNTYwLjc1NyknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J000NzMuMTY0LDY2Mi4wMjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM3LjM3LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTQxMS43NTIgLTU2OS4xMzEpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNNjg3Ljk2NCw4NDcuMTI4YS4zNjQuMzY0LDAsMSwwLS4zNjQtLjM2NC4zNi4zNiwwLDAsMCwuMzY0LjM2NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC01OTUuMjg1IC03MjcuMjg3KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTYyMS4zNjQsODkxLjcxM2EuMzYuMzYsMCwwLDAsLjM2NC0uMzY0LjM0OC4zNDgsMCwwLDAtLjM2NC0uMzQ5LjM1Ny4zNTcsMCwxLDAsMCwuNzEzWicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTUzOC4zOCAtNzY1LjM5NSknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNzkuMjY0LDY4OS4xMjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM4LjM4LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTE2MC42MzIgLTU5Mi4yODYpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNNzk5LjE2NCw2NDIuMjI4YS4zNjQuMzY0LDAsMSwwLS4zNjQtLjM2NC4zNi4zNiwwLDAsMCwuMzY0LjM2NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC02OTAuMjk5IC01NTIuMjEzKScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTEwMjguNzY0LDc0NS45MjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM3LjM3LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTg4Ni40NzggLTY0MC44MTgpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTI0My42NjQsNTQzLjQyOGEuMzY0LjM2NCwwLDEsMC0uMzY0LS4zNjQuMzYuMzYsMCwwLDAsLjM2NC4zNjRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTA3MC4wOTcgLTQ2Ny43OTQpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTQwMS42NjQsMzQ4LjMyOGEuMzY0LjM2NCwwLDEsMC0uMzY0LS4zNjQuMzcuMzcsMCwwLDAsLjM2NC4zNjRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTIwNS4wOTggLTMwMS4wOTMpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTM2Mi4xNjQsMjU0LjUyOGEuMzY0LjM2NCwwLDEsMC0uMzY0LS4zNjQuMzYuMzYsMCwwLDAsLjM2NC4zNjRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTE3MS4zNDggLTIyMC45NDcpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTQ3My45NDQsMjAzLjYxM2EuMzU3LjM1NywwLDEsMCwwLS43MTMuMzQ4LjM0OCwwLDAsMC0uMzQ5LjM2NC4zMzYuMzM2LDAsMCwwLC4zNDkuMzQ5WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTEyNjYuODY5IC0xNzcuNDU2KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE1NTIuMzY0LDE5Ny43MjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM2LjM2LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTEzMzMuODYyIC0xNzIuNDE1KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE0NTMuMzY0LDE1Ny43MjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM1Mi4zNTIsMCwwLDAsLjM2NC4zNjRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTI0OS4yNzMgLTEzOC4yMzcpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTMwNS4zNjQsMzkuNzI4YS4zNjQuMzY0LDAsMSwwLS4zNjQtLjM2NC4zNy4zNywwLDAsMCwuMzY0LjM2NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMTIyLjgxNiAtMzcuNDEzKScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE2NzMuMzY0LDM5LjcyOGEuMzY0LjM2NCwwLDEsMC0uMzY0LS4zNjQuMzcuMzcsMCwwLDAsLjM2NC4zNjRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTQzNy4yNDkgLTM3LjQxMyknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNjYzLjQ2NCwyMjkuODI4YS4zNjQuMzY0LDAsMSwwLS4zNjQtLjM2NC4zNi4zNiwwLDAsMCwuMzY0LjM2NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xNDI4Ljc5IC0xOTkuODQyKScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE1MzkuOTY0LDQ3MS44MjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM2LjM2LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTEzMjMuMjY3IC00MDYuNjE2KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE2NTEuMDY0LDU3OC4wMjhhLjM2NC4zNjQsMCwxLDAtLjM2NC0uMzY0LjM3LjM3LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTE0MTguMTk1IC00OTcuMzU4KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE1OTEuODY0LDc1My40MTNhLjM2LjM2LDAsMCwwLC4zNjQtLjM2NC4zNDguMzQ4LDAsMCwwLS4zNjQtLjM0OS4zNTcuMzU3LDAsMSwwLDAsLjcxM1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMzY3LjYxMiAtNjQ3LjIyNiknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xMjczLjI2NCw3MzguNTI4YS4zNjQuMzY0LDAsMSwwLS4zNjQtLjM2NC4zNi4zNiwwLDAsMCwuMzY0LjM2NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMDk1LjM4OCAtNjM0LjQ5NSknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xMTQyLjM2NCw4NTkuNTI4YS4zNjQuMzY0LDAsMSwwLS4zNjQtLjM2NC4zOC4zOCwwLDAsMCwuMzY0LjM2NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC05ODMuNTQyIC03MzcuODgyKScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTEwMjYuMzY0LDEyMy42MjhhLjM0OC4zNDgsMCwwLDAsLjM0OS0uMzY0LjM1Ny4zNTcsMCwxLDAtLjM0OS4zNjRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtODg0LjQyNyAtMTA5LjEwMSknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xMzIuMzY0LDUyLjAyOGEuMzQ4LjM0OCwwLDAsMCwuMzQ5LS4zNjQuMzU3LjM1NywwLDEsMC0uNzEzLDAsLjM3LjM3LDAsMCwwLC4zNjQuMzY0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTEyMC41NTkgLTQ3LjkyMyknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNDUuMiw2Mi40OTRhLjU5LjU5LDAsMCwwLC42LS42LjYuNiwwLDAsMC0uNi0uNi42MDkuNjA5LDAsMCwwLS42LjYuNi42LDAsMCwwLC42LjZaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTMxLjMyNSAtNTYuNDY3KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTI3OS42LDI5LjI5NGEuNi42LDAsMCwwLC42LS42LjYwOS42MDksMCwwLDAtLjYtLjYuNi42LDAsMCwwLS42LjYuNTkuNTksMCwwLDAsLjYuNlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0yNDYuMTYxIC0yOC4xKScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTMyOSw3Ni4xOTRhLjYwOS42MDksMCwwLDAsLjYtLjYuNi42LDAsMCwwLS42LS42LjYuNiwwLDAsMCwwLDEuMTk0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTI4OC4zNzEgLTY4LjE3MyknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J002NDEuMyw1Mi43OTRhLjYuNiwwLDAsMCwuNi0uNi41OS41OSwwLDAsMC0uNi0uNi42LjYsMCwwLDAsMCwxLjE5NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC01NTUuMjEyIC00OC4xNzkpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMjY2LjQsMzc1LjM5NGEuNi42LDAsMCwwLC42LS42LjYwOS42MDksMCwwLDAtLjYtLjYuNi42LDAsMCwwLS42LjYuNTkuNTksMCwwLDAsLjYuNlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0yMzQuODgzIC0zMjMuODIxKScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTU3Mi42LDcxOC42OTRhLjYuNiwwLDAsMCwuNi0uNi42MDkuNjA5LDAsMCwwLS42LS42LjYuNiwwLDEsMCwwLDEuMTk0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTQ5Ni41MTIgLTYxNy4xNSknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J001NCw4NzYuNjk0YS42LjYsMCwxLDAsMC0xLjE5NC42MDkuNjA5LDAsMCwwLS42LjYuNi42LDAsMCwwLC42LjZaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNTMuNCAtNzUyLjE1MiknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xMDAyLjMsOTA4Ljc5NGEuNTkuNTksMCwwLDAsLjYtLjYuNi42LDAsMCwwLS42LS42LjYwOS42MDksMCwwLDAtLjYuNi41OS41OSwwLDAsMCwuNi42WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTg2My42NjQgLTc3OS41NzkpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTE5Mi45LDQ3NC4xOTRhLjYuNiwwLDAsMCwuNi0uNi41OS41OSwwLDAsMC0uNi0uNi42LjYsMCwxLDAsMCwxLjE5NFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMDI2LjUyIC00MDguMjQpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTU4OC4xLDY3My40OTRhLjU5LjU5LDAsMCwwLC42LS42LjYuNiwwLDAsMC0uNi0uNi42MDkuNjA5LDAsMCwwLS42LjYuNi42LDAsMCwwLC42LjZaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTM2NC4xOTUgLTU3OC41MyknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J005MzUuNCwyMjAuMDk0YS42LjYsMCwwLDAsLjYtLjYuNTkuNTksMCwwLDAtLjYtLjYuNi42LDAsMCwwLS42LjYuNTkuNTksMCwwLDAsLjYuNlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC04MDYuNTAyIC0xOTEuMTI3KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE1ODIuNiw2My40OTRhLjYwOS42MDksMCwwLDAsLjYtLjYuNi42LDAsMSwwLTEuMTk0LDAsLjYwOS42MDksMCwwLDAsLjYuNlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMzU5LjQ5NSAtNTcuMzIyKScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTY3OS4yNDcsNDQ2Ljk5NWEuMjQ3LjI0NywwLDEsMC0uMjQ3LS4yNDcuMjQ1LjI0NSwwLDAsMCwuMjQ3LjI0N1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC01ODcuOTM3IC0zODUuNTk3KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTY3Ny41NDcsMTYwLjk5NWEuMjU1LjI1NSwwLDAsMCwuMjQ3LS4yNDcuMjQ1LjI0NSwwLDAsMC0uMjQ3LS4yNDcuMjQ3LjI0NywwLDEsMCwwLC40OTVaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNTg2LjQ4NCAtMTQxLjIyOCknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J005NjUuMjQ3LDY1LjU5NWEuMjU1LjI1NSwwLDAsMCwuMjQ3LS4yNDcuMjQ1LjI0NSwwLDAsMC0uMjQ3LS4yNDcuMjM3LjIzNywwLDAsMC0uMjQ3LjI0Ny4yNDUuMjQ1LDAsMCwwLC4yNDcuMjQ3WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTgzMi4zMDYgLTU5LjcxNCknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xMzE1Ljk0OCwyOTcuNjk1YS4yNDcuMjQ3LDAsMSwwLS4yNDctLjI0Ny4yMzcuMjM3LDAsMCwwLC4yNDcuMjQ3WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTExMzEuOTU4IC0yNTguMDI5KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTE1NjUuMzQ4LDI5Ny42OTVhLjI1NS4yNTUsMCwwLDAsLjI0Ny0uMjQ3LjI0NS4yNDUsMCwwLDAtLjI0Ny0uMjQ3LjI1NS4yNTUsMCwwLDAtLjI0OC4yNDcuMjM3LjIzNywwLDAsMCwuMjQ4LjI0N1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMzQ1LjA1NSAtMjU4LjAyOSknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNjI3LjA0OCw1MTcuNDk1YS4yNDcuMjQ3LDAsMCwwLDAtLjQ5NS4yNDcuMjQ3LDAsMSwwLDAsLjQ5NVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xMzk3Ljc3NCAtNDQ1LjgzNSknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xMDQxLjc0OCw1MzcuMjk1YS4yNDcuMjQ3LDAsMCwwLDAtLjQ5NS4yNDcuMjQ3LDAsMSwwLDAsLjQ5NVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC04OTcuNjcxIC00NjIuNzUzKScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTExMzguMTQ3LDcyOS44OTVhLjI0Ny4yNDcsMCwxLDAtLjI0Ny0uMjQ3LjI0NS4yNDUsMCwwLDAsLjI0Ny4yNDdaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtOTgwLjAzOSAtNjI3LjMxOCknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J000MjYuOTQ3LDQwNi4zOTVhLjI0Ny4yNDcsMCwxLDAsMC0uNDk1LjI1NS4yNTUsMCwwLDAtLjI0Ny4yNDcuMjQ1LjI0NSwwLDAsMCwuMjQ3LjI0N1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0zNzIuMzYyIC0zNTAuOTA3KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTI1Ni40NDcsMjEzLjE5NWEuMjQ3LjI0NywwLDEsMC0uMjQ3LS4yNDcuMjQ1LjI0NSwwLDAsMCwuMjQ3LjI0N1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0yMjYuNjggLTE4NS44MjkpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMjUxLjU0NywzMzcuMjk1YS4yNDcuMjQ3LDAsMSwwLS4yNDctLjI0Ny4yNTUuMjU1LDAsMCwwLC4yNDcuMjQ3WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTIyMi40OTMgLTI5MS44NjUpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTU3Ljc0Nyw1MTAuMDk1YS4yNDcuMjQ3LDAsMCwwLDAtLjQ5NS4yNDUuMjQ1LDAsMCwwLS4yNDcuMjQ3LjIzNy4yMzcsMCwwLDAsLjI0Ny4yNDdaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTQyLjM0NyAtNDM5LjUxMiknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00yMTQuMzQ3LDE3NS4xOTVhLjI0NS4yNDUsMCwwLDAsLjI0Ny0uMjQ3LjI0Ny4yNDcsMCwwLDAtLjQ5NSwwLC4yNDUuMjQ1LDAsMCwwLC4yNDcuMjQ3WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTE5MC43MDggLTE1My4zNjEpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMzcwLjE0LDMyMi40OTVhLjI1NS4yNTUsMCwwLDAsLjI0Ny0uMjQ3LjI0NS4yNDUsMCwwLDAtLjI0Ny0uMjQ3LjI1NS4yNTUsMCwwLDAtLjI0Ny4yNDcuMjM3LjIzNywwLDAsMCwuMjQ3LjI0N1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0zMjMuODIzIC0yNzkuMjIpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNMTkyLjY0Nyw4NzIuNjk1YS4yNDcuMjQ3LDAsMSwwLS4yNDctLjI0Ny4yNDUuMjQ1LDAsMCwwLC4yNDcuMjQ3WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTE3Mi4xNjcgLTc0OS4zMzIpJyBmaWxsPSclMjNmZmYnIGZpbGwtcnVsZT0nZXZlbm9kZCcvJTNFJTNDcGF0aCBkPSdNNTQyLjk0OCw5MzcuMjk1YS4yNTUuMjU1LDAsMCwwLC4yNDctLjI0Ny4yNDUuMjQ1LDAsMCwwLS4yNDctLjI0Ny4yNTUuMjU1LDAsMCwwLS4yNDcuMjQ3LjI0NS4yNDUsMCwwLDAsLjI0Ny4yNDdaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNDcxLjQ3NyAtODA0LjUyOSknIGZpbGw9JyUyM2ZmZicgZmlsbC1ydWxlPSdldmVub2RkJy8lM0UlM0NwYXRoIGQ9J00xNjkxLjI0OCw4ODEuOTk1YS4yNDcuMjQ3LDAsMSwwLS4yNDgtLjI0Ny4yNTUuMjU1LDAsMCwwLC4yNDguMjQ3WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTE0NTIuNjI5IC03NTcuMjc4KScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQ3BhdGggZD0nTTEzMzEuNDQ4LDY0NC4xOTVhLjI0Ny4yNDcsMCwwLDAsMC0uNDk1LjI0Ny4yNDcsMCwwLDAsMCwuNDk1WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTExNDUuMjAyIC01NTQuMDkzKScgZmlsbD0nJTIzZmZmJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnLyUzRSUzQy9nJTNFJTNDL3N2ZyUzRVwiKTtcblx0Y3Vyc29yOiB1cmwoJ2RhdGE6aW1hZ2Uvc3ZnK3htbDt1dGY4LDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHdpZHRoPVwiNDBcIiBoZWlnaHQ9XCI0MFwiIHZpZXdCb3g9XCIwIDAgNDAgNDBcIj48ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTg0NCAtNTAwKVwiPjxnIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSg4NDQgLTUyMC4zNilcIj48cGF0aCBkPVwiTTE5NC43ODcsMTIxMi4yOWEyLjg1OCwyLjg1OCwwLDEsMCwyLjg1OCwyLjg1OCwyLjg2OSwyLjg2OSwwLDAsMC0yLjg1OC0yLjg1OFpcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTE3NC43OTIgLTE3NC43OTMpXCIgZmlsbD1cIiUyMzg2ODY4NlwiLz48cGF0aCBkPVwiTTIwOS40MTYsMTIyOC4zNWExLjQyOSwxLjQyOSwwLDEsMS0xLjQyNCwxLjQyNCwxLjQxOSwxLjQxOSwwLDAsMSwxLjQyNC0xLjQyNFpcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTE4OS40MjEgLTE4OS40MTkpXCIgZmlsbD1cIiUyM2ZmNjU1YlwiLz48ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoMCAxMDIwLjM2KVwiPjxwYXRoIGQ9XCJNMjE2LjAyNCwxMDIwLjM2djEyLjg1NWgxLjQyNFYxMDIwLjM2WlwiIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgtMTk2LjczNiAtMTAyMC4zNilcIiBmaWxsPVwiJTIzODY4Njg2XCIvPjxwYXRoIGQ9XCJNMjE2LjAyNCwxMzI0LjI2djEyLjg2NmgxLjQyNFYxMzI0LjI2WlwiIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgtMTk2LjczNiAtMTI5Ny4xMjYpXCIgZmlsbD1cIiUyMzg2ODY4NlwiLz48cGF0aCBkPVwiTTMwNC4wMTYsMTIzNi4yN3YxLjQzNGgxMi44NTV2LTEuNDM0WlwiIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgtMjc2Ljg3MSAtMTIxNi45OTIpXCIgZmlsbD1cIiUyMzg2ODY4NlwiLz48cGF0aCBkPVwiTTAsMTIzNi4yN3YxLjQzNEgxMi44NTV2LTEuNDM0WlwiIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgwIC0xMjE2Ljk5MilcIiBmaWxsPVwiJTIzODY4Njg2XCIvPjwvZz48ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoOC44NjEgMTAyOS4yMTYpXCI+PHBhdGggZD1cIk0yNDQuNSwxMTE5LjU0OGEuNzE0LjcxNCwwLDAsMC0uMTIsMS40MDksMTAsMTAsMCwwLDEsNy40LDcuMzkxLjcxNS43MTUsMCwwLDAsMS4zOTEtLjMzdjBhMTEuNDMxLDExLjQzMSwwLDAsMC04LjQ1NC04LjQ0My43MTguNzE4LDAsMCwwLS4yMTItLjAyM1pcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTIzMC45MTggLTExMTkuNTQ3KVwiIGZpbGw9XCIlMjM4Njg2ODZcIi8+PHBhdGggZD1cIk0xMDcuOTcxLDExMTkuNTg5YS43MjEuNzIxLDAsMCwwLS4xOS4wMjMsMTEuNDI4LDExLjQyOCwwLDAsMC04LjQ0LDguNDI3LjcxNC43MTQsMCwwLDAsMS4zNzkuMzY5YzAtLjAxLjAwNS0uMDIxLjAwOC0uMDMxYTEwLDEwLDAsMCwxLDcuMzg2LTcuMzc3LjcxNC43MTQsMCwwLDAtLjE0Mi0xLjQwOVpcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTk5LjMxIC0xMTE5LjU4NilcIiBmaWxsPVwiJTIzODY4Njg2XCIvPjxwYXRoIGQ9XCJNMjUyLjQwNywxMjY0LjMzOGEuNzE0LjcxNCwwLDAsMC0uNzEyLjU1NSwxMCwxMCwwLDAsMS03LjM4Niw3LjM4LjcxNC43MTQsMCwwLDAsLjI4MiwxLjRsLjA1My0uMDEzYTExLjQzLDExLjQzLDAsMCwwLDguNDQtOC40MjkuNzEzLjcxMywwLDAsMC0uNjc4LS44OTNaXCIgdHJhbnNmb3JtPVwidHJhbnNsYXRlKC0yMzAuODM1IC0xMjUxLjQxKVwiIGZpbGw9XCIlMjM4Njg2ODZcIi8+PHBhdGggZD1cIk05OS45MjQsMTI2NC4wNzdhLjcxNC43MTQsMCwwLDAtLjY1Ni44OSwxMS40MzEsMTEuNDMxLDAsMCwwLDguNDQsOC40NTQuNzE1LjcxNSwwLDAsMCwuMzM1LTEuMzloMGE5Ljk5NSw5Ljk5NSwwLDAsMS03LjM4Ni03LjQuNzE0LjcxNCwwLDAsMC0uNzM0LS41NThoMFpcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTk5LjI0NiAtMTI1MS4xNzIpXCIgZmlsbD1cIiUyMzg2ODY4NlwiLz48L2c+PGcgdHJhbnNmb3JtPVwidHJhbnNsYXRlKDIgMTAyMi4zNilcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cIiUyMzcwNzA3MFwiIHN0cm9rZS13aWR0aD1cIjJcIj48Y2lyY2xlIGN4PVwiMThcIiBjeT1cIjE4XCIgcj1cIjE4XCIgc3Ryb2tlPVwibm9uZVwiLz48Y2lyY2xlIGN4PVwiMThcIiBjeT1cIjE4XCIgcj1cIjE3XCIgZmlsbD1cIm5vbmVcIi8+PC9nPjwvZz48L2c+PC9zdmc+JykgMTYgMTYsIGF1dG87XG59XG4uZ2Z4IHtcblx0cG9zaXRpb246YWJzb2x1dGU7XG5cdG9wYWNpdHk6MTtcblx0dHJhbnNpdGlvbjogb3BhY2l0eSAwLjZzO1xufVxuXG4uZ2Z4LmFjdGl2ZSB7XG5cdG9wYWNpdHk6MDtcbn1cblxuLmFzdGVyb2lkIHtcblx0d2lkdGg6NDBweDtcblx0aGVpZ2h0OjQwcHg7XG5cdGJhY2tncm91bmQtaW1hZ2U6IHVybChcImRhdGE6aW1hZ2Uvc3ZnK3htbCwlM0NzdmcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJyB3aWR0aD0nNjAnIGhlaWdodD0nNjAnIHZpZXdCb3g9JzAgMCA2MCA2MCclM0UlM0NnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDAgMCknJTNFJTNDcGF0aCBkPSdNMjMwLjk5NCwxMS43NDIsMjIxLjg2NywyMi40djJBMTQuNjcxLDE0LjY3MSwwLDAsMCwyMzYuMywxMi4zNjYsMjUuNzQxLDI1Ljc0MSwwLDAsMCwyMzAuOTk0LDExLjc0MlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xOTUuODY3IC0xMC4zNjYpJyBmaWxsPSclMjM0YThkYzYnLyUzRSUzQ3BhdGggZD0nTTE0Ni4xNzksMTEuOTg0bC4wMzUtLjI2OGEzMS45NzYsMzEuOTc2LDAsMCwwLTIwLjM4MSw3LjQsMTQuNjM1LDE0LjYzNSwwLDAsMCwxMS4yNTQsNS4yNjJ2LTJDMTQxLjU2LDIyLjM3NSwxNDUuMzgzLDE4LDE0Ni4xNzksMTEuOTg0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTExMS4wODggLTEwLjM0KScgZmlsbD0nJTIzNzdhYWQ0Jy8lM0UlM0NwYXRoIGQ9J00yNDEuMDU5LDI0LjIyMUExMC42NjMsMTAuNjYzLDAsMCwwLDIzMy45LDcuNDQxYTIyLjE2NywyMi4xNjcsMCwwLDAtOC40NzItNC45MTNjLjAxMS0uMDU3LjAyMi0uMTE0LjAzMy0uMTcxYTIsMiwwLDAsMC0zLjkzNi0uNzEzLDEyLjYyMSwxMi42MjEsMCwwLDEtMS4zNTMsMy44MmwtMTIuODEsNTEuODg2YTEwLjY2MywxMC42NjMsMCwwLDAsMTcuMTc4LTQuNzE5LDM1LjE4OCwzNS4xODgsMCwwLDAsNC41NzYtMy4zMzksNC42NjYsNC42NjYsMCwwLDAsNS4yLTUuNTA2QTMxLjgsMzEuOCwwLDAsMCwyNDEuMDU5LDI0LjIyMVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xODMuMDY0IDApJyBmaWxsPSclMjNhNWM2ZTMnLyUzRSUzQ3BhdGggZD0nTTUzLjkxNCw2Ny44Yy41MjgtNi4yNTktMS4zNzItMTEuOS01LjM1MS0xNS44NzVBMTguOTE3LDE4LjkxNywwLDAsMCwzNy4xMSw0Ni42MTlhMTIuNjcyLDEyLjY3MiwwLDAsMS0yMC44MywyLjAyNiwyLDIsMCwxLDAtMy4wNjgsMi41NjdsLjAxNi4wMTlxLS42NTcuNi0xLjI5MywxLjIyOWEzNS43NDQsMzUuNzQ0LDAsMCwwLTQuMTc3LDUuMDE3QTEyLjY3MiwxMi42NzIsMCwwLDAsMi4wMTMsNzYuMDA5LDIzLjEsMjMuMSwwLDAsMCw4LjYwOCw5MS45MTYsMjMuMDY0LDIzLjA2NCwwLDAsMCwyNC4zLDk4LjUwNWE1MS43MzgsNTEuNzM4LDAsMCwwLDIwLjkzNi0xMi43OEEyOS4wNzIsMjkuMDcyLDAsMCwwLDUzLjkxNCw2Ny44WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMCAtNDEuMTU2KScgZmlsbD0nJTIzZDJlM2YxJy8lM0UlM0NwYXRoIGQ9J00yNjcuMzc4LDM2NC4wODl2MTMuMzMzYTYuNjY3LDYuNjY3LDAsMCwwLDAtMTMuMzMzWicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTIzNi4wNDUgLTMyMS40MjMpJyBmaWxsPSclMjM0YThkYzYnLyUzRSUzQ3BhdGggZD0nTTIxOS44MjEsMzcwLjc1NmMwLTMuNjgyLTEuMTk0LTYuNjY3LTIuNjY3LTYuNjY3YTYuNjY3LDYuNjY3LDAsMCwwLDAsMTMuMzMzQzIxOC42MjgsMzc3LjQyMiwyMTkuODIxLDM3NC40MzgsMjE5LjgyMSwzNzAuNzU2WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTE4NS44MjEgLTMyMS40MjMpJyBmaWxsPSclMjM3N2FhZDQnLyUzRSUzQ3BhdGggZD0nTTQyMC45NzgsOTYuNzExdjEzLjMzM2E2LjY2Nyw2LjY2NywwLDAsMCwwLTEzLjMzM1onIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0zNzEuNjQ1IC04NS4zNzgpJyBmaWxsPSclMjM0YThkYzYnLyUzRSUzQ3BhdGggZD0nTTM3My40MjEsMTAzLjM3OGMwLTMuNjgyLTEuMTk0LTYuNjY3LTIuNjY3LTYuNjY3YTYuNjY3LDYuNjY3LDAsMSwwLDAsMTMuMzMzQzM3Mi4yMjgsMTEwLjA0NCwzNzMuNDIxLDEwNy4wNiwzNzMuNDIxLDEwMy4zNzhaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMzIxLjQyMSAtODUuMzc4KScgZmlsbD0nJTIzNzdhYWQ0Jy8lM0UlM0NnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDE1LjY2NyAyNSknJTNFJTNDY2lyY2xlIGN4PScxJyBjeT0nMScgcj0nMScgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTMuMzMzIDQpJyBmaWxsPSclMjNhNWM2ZTMnLyUzRSUzQ2NpcmNsZSBjeD0nMScgY3k9JzEnIHI9JzEnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDE3LjMzMyknIGZpbGw9JyUyM2E1YzZlMycvJTNFJTNDY2lyY2xlIGN4PScxJyBjeT0nMScgcj0nMScgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMjggMTIuNjY3KScgZmlsbD0nJTIzYTVjNmUzJy8lM0UlM0NjaXJjbGUgY3g9JzEnIGN5PScxJyByPScxJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgwIDI0LjY2NyknIGZpbGw9JyUyM2E1YzZlMycvJTNFJTNDL2clM0UlM0NwYXRoIGQ9J00xMDguMDg5LDE2NC45Nzh2MTcuMzMzYTguNjY3LDguNjY3LDAsMSwwLDAtMTcuMzMzWicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTk1LjQyMiAtMTQ1LjY0NSknIGZpbGw9JyUyMzRhOGRjNicvJTNFJTNDcGF0aCBkPSdNNDcuNDY2LDE3My42NDRjMC00Ljc4Ni0yLjA4OS04LjY2Ny00LjY2Ny04LjY2N2E4LjY2Nyw4LjY2NywwLDEsMCwwLDE3LjMzM0M0NS4zNzcsMTgyLjMxLDQ3LjQ2NiwxNzguNDMsNDcuNDY2LDE3My42NDRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMzAuMTMzIC0xNDUuNjQ0KScgZmlsbD0nJTIzNzdhYWQ0Jy8lM0UlM0MvZyUzRSUzQy9zdmclM0VcIik7XG5cdGJhY2tncm91bmQtc2l6ZTpjb250YWluO1xuXHRiYWNrZ3JvdW5kLXJlcGVhdDpuby1yZXBlYXQ7XG59XG4uc3BhY2VzaGlwIHtcblx0d2lkdGg6MzZweDtcblx0aGVpZ2h0OjQ2cHg7XG5cdGJhY2tncm91bmQtaW1hZ2U6IHVybChcImRhdGE6aW1hZ2Uvc3ZnK3htbCwlM0NzdmcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJyB3aWR0aD0nMjYuMzQyJyBoZWlnaHQ9JzM2JyB2aWV3Qm94PScwIDAgMjYuMzQyIDM2JyUzRSUzQ2cgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTEyMy41ODMgMCknJTNFJTNDcGF0aCBkPSdNMTM2Ljc1NSwxNTAuMDYzbC0xMi41MTIsMTAuMDFhMS43NTYsMS43NTYsMCwwLDAtLjY1OSwxLjM3MXY0LjQyNGwxMy4xNzEtMi42MzQsMTMuMTcxLDIuNjM0di00LjQyNGExLjc1NiwxLjc1NiwwLDAsMC0uNjU5LTEuMzcxWicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTAuMDAxIC0xMzUuMTM3KScgZmlsbD0nJTIzZmY2NDY0Jy8lM0UlM0NwYXRoIGQ9J00yMjAuNjE2LDMxMy4xMzhsLTEuMDQ0LTQuMTc3aC02LjY0bC0xLjA0NCw0LjE3N2EuODc4Ljg3OCwwLDAsMCwuODUyLDEuMDkxaDcuMDI1YS44NzguODc4LDAsMCwwLC44NTItMS4wOTFaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNzkuNDk4IC0yNzguMjMpJyBmaWxsPSclMjM5NTljYjMnLyUzRSUzQ3BhdGggZD0nTTIxNC41MjMsMzEzLjEzOGwxLjA0NC00LjE3N2gtMi42MzRsLTEuMDQ0LDQuMTc3YS44NzguODc4LDAsMCwwLC44NTIsMS4wOTFoMi42MzRhLjg3OC44NzgsMCwwLDEtLjg1Mi0xLjA5MVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC03OS40OTggLTI3OC4yMyknIGZpbGw9JyUyMzcwNzQ4NycvJTNFJTNDcGF0aCBkPSdNMjA3LjU2OS40MjksMjAzLjQ4LDcuNzM2YTMuNTEzLDMuNTEzLDAsMCwwLS40NDcsMS43MTVWMzAuNzMyYTEuNzU2LDEuNzU2LDAsMCwwLDEuNzU2LDEuNzU2aDcuMDI1YTEuNzU2LDEuNzU2LDAsMCwwLDEuNzU2LTEuNzU2VjkuNDVhMy41MTEsMy41MTEsMCwwLDAtLjQ0Ny0xLjcxNUwyMDkuMDM0LjQyOUEuODM5LjgzOSwwLDAsMCwyMDcuNTY5LjQyOVonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC03MS41NDcgMCknIGZpbGw9JyUyM2U0ZWFmNicvJTNFJTNDcGF0aCBkPSdNMjA2LjU0NSwzMC43ODFWOS41YTcuNjU4LDcuNjU4LDAsMCwxLC4xODYtMS43MTVsMS43LTcuMzA3YTEuMTExLDEuMTExLDAsMCwxLC4xNTctLjM3MS44MzMuODMzLDAsMCwwLTEuMDIzLjM3MUwyMDMuNDgsNy43ODVhMy41MTMsMy41MTMsMCwwLDAtLjQ0NywxLjcxNVYzMC43ODFhMS43NTYsMS43NTYsMCwwLDAsMS43NTYsMS43NTZoMi40ODhDMjA2Ljg3MywzMi41MzcsMjA2LjU0NSwzMS43NTEsMjA2LjU0NSwzMC43ODFaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNzEuNTQ3IC0wLjA0OSknIGZpbGw9JyUyM2M3Y2ZlMicvJTNFJTNDcGF0aCBkPSdNMjA5LjAzNS40M2EuODM5LjgzOSwwLDAsMC0xLjQ2NCwwbC00LjA4OSw3LjMwN2EzLjUxMywzLjUxMywwLDAsMC0uNDQ3LDEuNzE1djQuNmgxMC41Mzd2LTQuNmEzLjUxMSwzLjUxMSwwLDAsMC0uNDQ3LTEuNzE1WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTcxLjU0OCAtMC4wMDEpJyBmaWxsPSclMjNmZjY0NjQnLyUzRSUzQ3BhdGggZD0nTTIwNi41NDYsOS41MTJhNy42NTgsNy42NTgsMCwwLDEsLjE4Ni0xLjcxNWwxLjctNy4zMDdhMS4xMTEsMS4xMTEsMCwwLDEsLjE1Ny0uMzcxLjg2Ljg2LDAsMCwwLS41NTMtLjAxMmMtLjAxMywwLS4wMjYuMDExLS4wMzkuMDE2YS44MTIuODEyLDAsMCwwLS4xOTMuMTA2Yy0uMDE5LjAxNC0uMDM4LjAyNy0uMDU2LjA0M2EuODIxLjgyMSwwLDAsMC0uMTgyLjIxOEwyMDMuNDgxLDcuOGEzLjUxMywzLjUxMywwLDAsMC0uNDQ3LDEuNzE1djQuNmgzLjUxMlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC03MS41NDggLTAuMDYxKScgZmlsbD0nJTIzZDI1NTVhJy8lM0UlM0NwYXRoIGQ9J00yMTMuNTcxLDE0MS4yMzVIMjAzLjAzNHYxLjc1NmgyLjI1MmEzLjQ2OSwzLjQ2OSwwLDAsMCw2LjAzNCwwaDIuMjUydi0xLjc1NlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC03MS41NDggLTEyNy4xODcpJyBmaWxsPSclMjNjN2NmZTInLyUzRSUzQ2NpcmNsZSBjeD0nMS43NTYnIGN5PScxLjc1Nicgcj0nMS43NTYnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEzNC45OTkgMTIuMjkyKScgZmlsbD0nJTIzNWI1ZDZlJy8lM0UlM0NwYXRoIGQ9J00yMDYuNTQ2LDE0NC4yNjZ2LTMuMDMyaC0zLjUxMnYxLjc1NmgyLjI1MkEzLjU1MSwzLjU1MSwwLDAsMCwyMDYuNTQ2LDE0NC4yNjZaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtNzEuNTQ4IC0xMjcuMTg2KScgZmlsbD0nJTIzYWZiOWQyJy8lM0UlM0NwYXRoIGQ9J00yMTkuNjc3LjQyOWwtMy4yLDUuNzE2aDcuODYzbC0zLjItNS43MTZBLjgzOS44MzksMCwwLDAsMjE5LjY3Ny40MjlaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtODMuNjU1IDApJyBmaWxsPSclMjM3MDc0ODcnLyUzRSUzQ3BhdGggZD0nTTIxOS4yMTEsNi4yMDYsMjIwLjU0NC40ODlBMS4xMTEsMS4xMTEsMCwwLDEsMjIwLjcuMTE4YS44Ni44NiwwLDAsMC0uNTUzLS4wMTJsLS4wMTEsMC0uMDI4LjAxMWEuODEyLjgxMiwwLDAsMC0uMTkzLjEwNmwtLjAyLjAxNWMtLjAxMi4wMDktLjAyNS4wMTgtLjAzNy4wMjhhLjgyMy44MjMsMCwwLDAtLjE4Mi4yMThsLTMuMiw1LjcxNmgyLjczMlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC04My42NTYgLTAuMDYpJyBmaWxsPSclMjM1YjVkNmUnLyUzRSUzQ2cgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTIzLjU4MyAyNS40NjMpJyUzRSUzQ3BhdGggZD0nTTEyMy41ODQsMjYxLjI2NGw3LjktMS41ODFWMjU2bC03LjksMi4xMDdaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTIzLjU4NCAtMjU1Ljk5NiknIGZpbGw9JyUyM2QyNTU1YScvJTNFJTNDcGF0aCBkPSdNMzE2Ljg3LDI2MS4yNjRsLTcuOS0xLjU4MVYyNTZsNy45LDIuMTA3WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTI5MC41MjcgLTI1NS45OTYpJyBmaWxsPSclMjNkMjU1NWEnLyUzRSUzQy9nJTNFJTNDZyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMjMuNTgzIDI1LjQ2MyknJTNFJTNDcGF0aCBkPSdNMTI0LjQ2MiwyNjQuODI0aDBhLjg3OC44NzgsMCwwLDAtLjg3OC44Nzh2Ny4wMjVhLjg3OC44NzgsMCwwLDAsLjg3OC44NzhoMGEuODc4Ljg3OCwwLDAsMCwuODc4LS44NzhWMjY1LjdBLjg3OC44NzgsMCwwLDAsMTI0LjQ2MiwyNjQuODI0WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTEyMy41ODQgLTI2My45NDYpJyBmaWxsPSclMjNhZmI5ZDInLyUzRSUzQ3BhdGggZD0nTTE1OS43NzMsMjU2aDBhLjg3OC44NzgsMCwwLDAtLjg3OC44Nzh2NC4zOWEuODc4Ljg3OCwwLDAsMCwuODc4Ljg3OGgwYS44NzguODc4LDAsMCwwLC44NzgtLjg3OHYtNC4zOUEuODc4Ljg3OCwwLDAsMCwxNTkuNzczLDI1NlonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0xNTUuMzgzIC0yNTUuOTk2KScgZmlsbD0nJTIzYWZiOWQyJy8lM0UlM0NwYXRoIGQ9J00zNzEuNjM5LDI2NC44MjRoMGEuODc4Ljg3OCwwLDAsMSwuODc4Ljg3OHY3LjAyNWEuODc4Ljg3OCwwLDAsMS0uODc4Ljg3OGgwYS44NzguODc4LDAsMCwxLS44NzgtLjg3OFYyNjUuN0EuODc4Ljg3OCwwLDAsMSwzNzEuNjM5LDI2NC44MjRaJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMzQ2LjE3NSAtMjYzLjk0NiknIGZpbGw9JyUyM2FmYjlkMicvJTNFJTNDcGF0aCBkPSdNMzM2LjMyOCwyNTZoMGEuODc4Ljg3OCwwLDAsMSwuODc4Ljg3OHY0LjM5YS44NzguODc4LDAsMCwxLS44NzguODc4aDBhLjg3OC44NzgsMCwwLDEtLjg3OC0uODc4di00LjM5QS44NzguODc4LDAsMCwxLDMzNi4zMjgsMjU2WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTMxNC4zNzYgLTI1NS45OTYpJyBmaWxsPSclMjNhZmI5ZDInLyUzRSUzQy9nJTNFJTNDZyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMjMuNTgzIDI1LjQ0NiknJTNFJTNDY2lyY2xlIGN4PScwLjg5NScgY3k9JzAuODk1JyByPScwLjg5NScgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMCAwLjg2MiknIGZpbGw9JyUyMzk1OWNiMycvJTNFJTNDY2lyY2xlIGN4PScwLjg5NScgY3k9JzAuODk1JyByPScwLjg5NScgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMy40OTYpJyBmaWxsPSclMjM5NTljYjMnLyUzRSUzQ2NpcmNsZSBjeD0nMC44OTUnIGN5PScwLjg5NScgcj0nMC44OTUnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDI0LjU1MiAwLjg2MiknIGZpbGw9JyUyMzk1OWNiMycvJTNFJTNDY2lyY2xlIGN4PScwLjg5NScgY3k9JzAuODk1JyByPScwLjg5NScgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMjEuMDU3KScgZmlsbD0nJTIzOTU5Y2IzJy8lM0UlM0MvZyUzRSUzQ2cgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTM1Ljg3NiAyMy43MDcpJyUzRSUzQ3BhdGggZD0nTTI0OC4wNSwyNDMuNjA4aDBhLjg3OC44NzgsMCwwLDAsLjg3OC0uODc4di0zLjUxMmEuODc4Ljg3OCwwLDAsMC0uODc4LS44NzhoMGEuODc4Ljg3OCwwLDAsMC0uODc4Ljg3OHYzLjUxMkEuODc4Ljg3OCwwLDAsMCwyNDguMDUsMjQzLjYwOFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC0yNDcuMTcyIC0yMzguMzQpJyBmaWxsPSclMjNjN2NmZTInLyUzRSUzQ3BhdGggZD0nTTI3NC41MzQsMjQzLjYwOGgwYS44NzguODc4LDAsMCwwLC44NzgtLjg3OHYtMy41MTJhLjg3OC44NzgsMCwwLDAtLjg3OC0uODc4aDBhLjg3OC44NzgsMCwwLDAtLjg3OC44Nzh2My41MTJBLjg3OC44NzgsMCwwLDAsMjc0LjUzNCwyNDMuNjA4WicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoLTI3MS4wMjIgLTIzOC4zNCknIGZpbGw9JyUyM2M3Y2ZlMicvJTNFJTNDL2clM0UlM0NwYXRoIGQ9J00yMjEuNTY3LDI0My42MDhoMGEuODc4Ljg3OCwwLDAsMCwuODc4LS44Nzh2LTMuNTEyYS44NzguODc4LDAsMCwwLS44NzgtLjg3OGgwYS44NzguODc4LDAsMCwwLS44NzguODc4djMuNTEyQS44NzguODc4LDAsMCwwLDIyMS41NjcsMjQzLjYwOFonIHRyYW5zZm9ybT0ndHJhbnNsYXRlKC04Ny40NDcgLTIxNC42MzMpJyBmaWxsPSclMjNhZmI5ZDInLyUzRSUzQy9nJTNFJTNDL3N2ZyUzRVwiKTtcblx0YmFja2dyb3VuZC1zaXplOmNvbnRhaW47XG5cdGJhY2tncm91bmQtcmVwZWF0Om5vLXJlcGVhdDtcbn1cblxuLmFzdGVyb2lkLmFjdGl2ZSB7XG5cdHdpZHRoOjYwcHg7XG5cdGhlaWdodDo2MHB4O1xuXHRiYWNrZ3JvdW5kLWltYWdlOiB1cmwoXCJkYXRhOmltYWdlL3N2Zyt4bWwsJTNDc3ZnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zycgd2lkdGg9JzY1JyBoZWlnaHQ9JzY0JyB2aWV3Qm94PScwIDAgNjUgNjQnJTNFJTNDZyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgtMTAwMyAtNDkwKSclM0UlM0NjaXJjbGUgY3g9JzIzLjUnIGN5PScyMy41JyByPScyMy41JyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMDA5IDUwMiknIGZpbGw9JyUyM2QyZTNmMScvJTNFJTNDY2lyY2xlIGN4PSc5JyBjeT0nOScgcj0nOScgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTAwOSA1MDIpJyBmaWxsPSclMjNkMmUzZjEnLyUzRSUzQ2NpcmNsZSBjeD0nMTInIGN5PScxMicgcj0nMTInIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEwMjEgNDkwKScgZmlsbD0nJTIzZDJlM2YxJy8lM0UlM0NjaXJjbGUgY3g9JzEyJyBjeT0nMTInIHI9JzEyJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMDMzIDQ5OSknIGZpbGw9JyUyM2QyZTNmMScvJTNFJTNDY2lyY2xlIGN4PScxMicgY3k9JzEyJyByPScxMicgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTAwMyA1MjApJyBmaWxsPSclMjNkMmUzZjEnLyUzRSUzQ2NpcmNsZSBjeD0nMTInIGN5PScxMicgcj0nMTInIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEwMzMgNTMwKScgZmlsbD0nJTIzZDJlM2YxJy8lM0UlM0NjaXJjbGUgY3g9JzcuNScgY3k9JzcuNScgcj0nNy41JyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMDQ4IDUyMyknIGZpbGw9JyUyM2QyZTNmMScvJTNFJTNDY2lyY2xlIGN4PSc3LjUnIGN5PSc3LjUnIHI9JzcuNScgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTAxMCA1MjMpJyBmaWxsPSclMjM0YThkYzYnLyUzRSUzQ2NpcmNsZSBjeD0nNy41JyBjeT0nNy41JyByPSc3LjUnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEwMTUgNTE0KScgZmlsbD0nJTIzNGE4ZGM2Jy8lM0UlM0NjaXJjbGUgY3g9JzE4JyBjeT0nMTgnIHI9JzE4JyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMDE4IDUwNCknIGZpbGw9JyUyMzRhOGRjNicvJTNFJTNDY2lyY2xlIGN4PSc3LjUnIGN5PSc3LjUnIHI9JzcuNScgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTAxMCA1MjMpJyBmaWxsPSclMjM0YThkYzYnLyUzRSUzQ2NpcmNsZSBjeD0nNC41JyBjeT0nNC41JyByPSc0LjUnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEwNTkgNTEzKScgZmlsbD0nJTIzZDJlM2YxJy8lM0UlM0NjaXJjbGUgY3g9JzcuNScgY3k9JzcuNScgcj0nNy41JyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMDM2IDUzMyknIGZpbGw9JyUyMzRhOGRjNicvJTNFJTNDY2lyY2xlIGN4PSc3LjUnIGN5PSc3LjUnIHI9JzcuNScgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTAyNyA0OTkpJyBmaWxsPSclMjM0YThkYzYnLyUzRSUzQ2NpcmNsZSBjeD0nNy41JyBjeT0nNy41JyByPSc3LjUnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEwMjAgNTE4KScgZmlsbD0nJTIzNzdhYWQ0Jy8lM0UlM0NjaXJjbGUgY3g9JzcuNScgY3k9JzcuNScgcj0nNy41JyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMDMzIDUwNyknIGZpbGw9JyUyMzc3YWFkNCcvJTNFJTNDY2lyY2xlIGN4PSc1LjUnIGN5PSc1LjUnIHI9JzUuNScgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTAzNyA1MjcpJyBmaWxsPSclMjM3N2FhZDQnLyUzRSUzQ2NpcmNsZSBjeD0nNCcgY3k9JzQnIHI9JzQnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEwMzcgNTI3KScgZmlsbD0nJTIzZmZmJy8lM0UlM0NjaXJjbGUgY3g9JzQnIGN5PSc0JyByPSc0JyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxMDI2IDUyMCknIGZpbGw9JyUyM2ZmZicvJTNFJTNDY2lyY2xlIGN4PSc0JyBjeT0nNCcgcj0nNCcgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMTA0MCA1MTEpJyBmaWxsPSclMjNmZmYnLyUzRSUzQy9nJTNFJTNDL3N2ZyUzRVwiKTtcblx0YmFja2dyb3VuZC1zaXplOmNvbnRhaW47XG5cdGJhY2tncm91bmQtcmVwZWF0Om5vLXJlcGVhdDtcbn1cblxuLyojIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYkluTnlZeTlqYjIxd2IyNWxiblJ6TDBGemRHVnliMmxrY3k1emRtVnNkR1VpWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanRCUVVOQkxHVkJRV1VzVTBGQlV5eERRVUZETEVOQlFVTXNSMEZCUnl4alFVRmpMRU5CUVVNc1owSkJRV2RDTEVOQlFVTXNRMEZCUXl4SFFVRkhMRmRCUVZjc1EwRkJRenM3UVVGRk4wVTdRMEZEUXl4WFFVRlhPME5CUTFnc2NVSkJRWEZDTzBOQlEzSkNMREpDUVVFeVFqdERRVU16UWl3d2FXUkJRVEJwWkR0RFFVTXhhV1FzSzJsRlFVRXJhVVU3UVVGRGFHcEZPMEZCUTBFN1EwRkRReXhwUWtGQmFVSTdRMEZEYWtJc1UwRkJVenREUVVOVUxIZENRVUYzUWp0QlFVTjZRanM3UVVGRlFUdERRVU5ETEZOQlFWTTdRVUZEVmpzN1FVRkZRVHREUVVORExGVkJRVlU3UTBGRFZpeFhRVUZYTzBOQlExZ3NjMjVHUVVGemJrWTdRMEZEZEc1R0xIVkNRVUYxUWp0RFFVTjJRaXd5UWtGQk1rSTdRVUZETlVJN1FVRkRRVHREUVVORExGVkJRVlU3UTBGRFZpeFhRVUZYTzBOQlExZ3NjVEJLUVVGeE1FbzdRMEZEY2pCS0xIVkNRVUYxUWp0RFFVTjJRaXd5UWtGQk1rSTdRVUZETlVJN08wRkJSVUU3UTBGRFF5eFZRVUZWTzBOQlExWXNWMEZCVnp0RFFVTllMR2t6UkVGQmFUTkVPME5CUTJvelJDeDFRa0ZCZFVJN1EwRkRka0lzTWtKQlFUSkNPMEZCUXpWQ0lpd2labWxzWlNJNkluTnlZeTlqYjIxd2IyNWxiblJ6TDBGemRHVnliMmxrY3k1emRtVnNkR1VpTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lKY2JqcG5iRzlpWVd3b0xtRXNMbU1wZTJacGJHdzZibTl1WlR0OUxtRjdjM1J5YjJ0bE9pTTNNRGN3TnpBN2MzUnliMnRsTFhkcFpIUm9Pakp3ZUR0OUxtSjdjM1J5YjJ0bE9tNXZibVU3ZlZ4dVhHNHVaMkZ0WlNCN1hHNWNkR2hsYVdkb2REb3hNREFsTzF4dVhIUmlZV05yWjNKdmRXNWtMWE5wZW1VNk16VXdjSGc3WEc1Y2RHSmhZMnRuY205MWJtUXRjbVZ3WldGME9tNXZMWEpsY0dWaGREdGNibHgwWW1GamEyZHliM1Z1WkMxcGJXRm5aVHAxY213b1hDSmtZWFJoT21sdFlXZGxMM04yWnl0NGJXd3NKVE5EYzNabklIaHRiRzV6UFNkb2RIUndPaTh2ZDNkM0xuY3pMbTl5Wnk4eU1EQXdMM04yWnljZ2QybGtkR2c5SnpJMU5DNDNNekluSUdobGFXZG9kRDBuTVRReUxqWTFKeUIyYVdWM1FtOTRQU2N3SURBZ01qVTBMamN6TWlBeE5ESXVOalVuSlRORkpUTkRjbVZqZENCM2FXUjBhRDBuTWpVMExqY3pNaWNnYUdWcFoyaDBQU2N4TkRJdU5qVW5JR1pwYkd3OUp5VXlNekkyTVRNMlpTY3ZKVE5GSlRORFp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d4TXk0M09Ua2dPQzR6TWpZcEp5VXpSU1V6UTJjZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9Oall1TnpJMUlERTJMakUxTnlrbkpUTkZKVE5EY0dGMGFDQmtQU2ROTmpBd0xqQTBNaXd5TmpFdU9EZ3pRVFEyTGpnME1pdzBOaTQ0TkRJc01Dd3hMREFzTlRVekxqSXNNakUxTGpBME1tRTBOaTQ1TXl3ME5pNDVNeXd3TERBc01DdzBOaTQ0TkRJc05EWXVPRFF5V2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVFUxTXk0eUlDMHhOamd1TWlrbklHWnBiR3c5SnlVeU16TXpNVEUzT0NjZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBOd1lYUm9JR1E5SjAwMk16Y3VNRE01TERJNU1pNDFOemhCTkRBdU5UTTVMRFF3TGpVek9Td3dMREVzTUN3MU9UWXVOU3d5TlRJdU1ETTVZVFF3TGpZeE5pdzBNQzQyTVRZc01Dd3dMREFzTkRBdU5UTTVMRFF3TGpVek9Wb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MwMU9UQXVNVGszSUMweU1EVXVNVGszS1NjZ1ptbHNiRDBuSlRJek0yRXhOVGd3SnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRZNU5DNDFORElzTXpRd0xqSTROVUV6TUM0M05ETXNNekF1TnpRekxEQXNNU3d3TERZMk15NDRMRE13T1M0MU5ETmhNekF1T0RBM0xETXdMamd3Tnl3d0xEQXNNQ3d6TUM0M05ESXNNekF1TnpReldpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRZME55NDNNREVnTFRJMk1pNDNNREVwSnlCbWFXeHNQU2NsTWpNME5ERTFPR1luSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTnpVeExqVXpOQ3d6T0RjdU5UWTNRVEl4TGpBek5Dd3lNUzR3TXpRc01Dd3hMREFzTnpNd0xqVXNNelkyTGpVek5HRXlNUzR3TnpJc01qRXVNRGN5TERBc01Dd3dMREl4TGpBek5Dd3lNUzR3TXpSYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TnpBMExqWTVNaUF0TXpFNUxqWTVNaWtuSUdacGJHdzlKeVV5TXpVeU1XSTVOaWNnWm1sc2JDMXlkV3hsUFNkbGRtVnViMlJrSnk4bE0wVWxNME12WnlVelJTVXpRMmNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb01Da25KVE5GSlRORGNHRjBhQ0JrUFNkTk1URXlMalF4TXl3NU1pNDBNVEZCTVRjdU5qQTJMREUzTGpZd05pd3dMREVzTUN3NU5DNDRMRGMwTGpoaE1UY3VOalF6TERFM0xqWTBNeXd3TERBc01Dd3hOeTQyTVRNc01UY3VOakV6V2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVGswTGpnZ0xUVTNMaklwSnlCbWFXeHNQU2NsTWpNek5ERXlOekFuSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTVRJMkxqTTBMREV3TXk0NU5qWmhNVFV1TWpNekxERTFMakl6TXl3d0xERXNNQzB4TlM0eU5DMHhOUzR5TkN3eE5TNHlOaXd4TlM0eU5pd3dMREFzTUN3eE5TNHlOQ3d4TlM0eU5Gb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MweE1EZ3VOekkzSUMwM01TNHhNamNwSnlCbWFXeHNQU2NsTWpNelpERXlOek1uSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTVRRM0xqazFPQ3d4TWpFdU9VRXhNUzQxTlN3eE1TNDFOU3d3TERFc01Dd3hNell1TkN3eE1UQXVNelF6TERFeExqVTNNeXd4TVM0MU56TXNNQ3d3TERBc01UUTNMamsxT0N3eE1qRXVPVm9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMHhNekF1TXpRMUlDMDVNaTQzTkRVcEp5Qm1hV3hzUFNjbE1qTTBPVEV5TnprbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk1UWTVMalFzTVRNNUxqWXdPR0UzTGprc055NDVMREFzTVN3d0xUY3VPUzAzTGprc055NDVNakVzTnk0NU1qRXNNQ3d3TERBc055NDVMRGN1T1ZvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzB4TlRFdU56a3hJQzB4TVRRdU1UQTJLU2NnWm1sc2JEMG5KVEl6TlRVeE5EZG1KeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpReTluSlRORkpUTkRaeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNneE9URXVOemMzSURFMExqa3dOU2tuSlRORkpUTkRjR0YwYUNCa1BTZE5NVFF4T0M0NU5USXNNVGN5TGpsaE5pNDJOVElzTmk0Mk5USXNNQ3d4TERBdE5pNDJOVEl0Tmk0Mk5USXNOaTQyTml3MkxqWTJMREFzTUN3d0xEWXVOalV5TERZdU5qVXlXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xURTBNVEl1TXlBdE1UVTVMallwSnlCbWFXeHNQU2NsTWpNek5ERXlOekFuSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTVRReU5DNHlORGtzTVRjM0xqTXhOR0UxTGpjMU55dzFMamMxTnl3d0xERXNNQzAxTGpjMUxUVXVOelVzTlM0M056UXNOUzQzTnpRc01Dd3dMREFzTlM0M05TdzFMamMxV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVEUwTVRjdU5UazNJQzB4TmpRdU9EazRLU2NnWm1sc2JEMG5KVEl6TTJReE1qY3pKeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVEUwTXpJdU16WTNMREU0TkM0d016UmhOQzR6Tmpjc05DNHpOamNzTUN3eExEQXROQzR6TmpjdE5DNHpOamNzTkM0ek9DdzBMak00TERBc01Dd3dMRFF1TXpZM0xEUXVNelkzV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVEUwTWpVdU56RTFJQzB4TnpNdU1ERTFLU2NnWm1sc2JEMG5KVEl6TkRreE1qYzVKeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVEUwTkRBdU5EZzBMREU1TUM0M05qaGhNaTQ1T0RRc01pNDVPRFFzTUN3eExEQXRNaTQ1T0RRdE1pNDVPRFFzTWk0NU9EZ3NNaTQ1T0Rnc01Dd3dMREFzTWk0NU9EUXNNaTQ1T0RSYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TVRRek15NDRNeklnTFRFNE1TNHhNeklwSnlCbWFXeHNQU2NsTWpNMU5URTBOMlluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5ETDJjbE0wVWxNME12WnlVelJTVXpRMmNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb01UazRMams1TnlBMk5TNDBPRGdwSnlVelJTVXpRM0JoZEdnZ1pEMG5UVEV6TnpjdU5ETXpMRFEzTUM0ek9HRXhNQzR5TkN3eE1DNHlOQ3d3TERFc01DMHhNQzR5TXpNdE1UQXVNalEzTERFd0xqSTJNeXd4TUM0eU5qTXNNQ3d3TERBc01UQXVNak16TERFd0xqSTBOMW9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMHhNelkzTGpFNE5TQXRORFE1TGprcEp5Qm1hV3hzUFNjbE1qTm1OalluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTVRNNU1TNHdOellzTkRRNUxqbGhNVEF1TWpRc01UQXVNalFzTUN3eExERXNNQ3d5TUM0ME9HTXRNUzR3TXpNdExqSTNOeTB6TGpJdExqUTFNUzB5TGpnMU15MHhMalF4TWk0eE56VXRMalE0TERFdU5UUXpMakU0T1N3eUxqa3VNekEyTERFdU9EQTFMakV6TVN3ekxqY3RMakl6TXl3ekxqa3hOaTB1T0RFMUxqTXdOaTB1T0RjekxURXVPRFl6TFM0eU9URXROQzR6TmpjdExqUXlNaTB5TGprMk9TMHVNVFl0Tmk0ek56WXRNUzR3TXpNdE5pNHlPRGd0TWk0ME1UWXVNRGN6TFRFdU1EUTRMRE11TURVM0xqTXdOaXcyTEM0MU5qZ3NNeXd1TWpjM0xEVXVPVFV6TFM0MU5UTXNOaTR4TVRRdE1pNHpMakUyTFRFdU56YzJMVEl1TnpNM0xURXVNekkxTFRZdU1EZzBMVEV1TkMwekxqRXpMUzR3TnpNdE55NHhMVEV1TVRNMUxUY3VNak0wTFRNdU1ESTRMUzR4TkRZdE1pNHdNemdzTXk0d05UY3RNUzR4T1RRc05pNHdPRFF0TVM0eU5USXNNeTR3TlRjdExqQTFPQ3cxTGprMU15MHhMakF6TkN3MUxqUXhOUzB6TGpBM01TMHVNamt4TFRFdU1UQTJMVEl1TVRFeExTNDBNRGd0TkM0ek5qY3RMak13Tm5NdE5DNDVPVE10TGpNM09DMDFMakUyTnkweExqTXhZeTB1TXpJdE1TNDNORGNzTXk0M09EUXRNeTQwTURZc05TNDVNemt0TXk0Mk1qVmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE1UTTRNQzQ0TWprZ0xUUTBPUzQ1S1NjZ1ptbHNiRDBuSlRJell6UXpaalUzSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRFek56Y3VNelE0TERRME9TNDVZeTR6TXpVc01Dd3VOamN1TURFMUxqazVMakEwTkdndExqSXpNMkV4TUM0eU5Td3hNQzR5TlN3d0xEQXNNQzB1T1Rrc01qQXVORFV4TERFd0xqSTBPU3d4TUM0eU5Ea3NNQ3d3TERFc0xqSXpNeTB5TUM0MVdpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRFek5qY3VNU0F0TkRRNUxqa3BKeUJtYVd4c1BTY2xNak5rWmprNVptWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRMMmNsTTBVbE0wTm5JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0RjeUxqSTNNU0F6TkM0ek16Z3BKeVV6UlNVelEzQmhkR2dnWkQwblRUUTVPQzQzTWpjc01qUXdMak0xTkdFeUxqSXlOeXd5TGpJeU55d3dMREVzTUMweUxqSXlOeTB5TGpJeU55d3lMakl6Tml3eUxqSXpOaXd3TERBc01Dd3lMakl5Tnl3eUxqSXlOMW9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMDBPVFl1TlNBdE1qTTFMamtwSnlCbWFXeHNQU2NsTWpNM1l6RXpOekFuSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTlRBMUxqVTRPU3d5TXpndU16RTFZVEl1TWpJNExESXVNakk0TERBc01Dd3hMVEV1TWpJekxEUXVNRGtzTVM0MU9ESXNNUzQxT0RJc01Dd3dMREV0TGpJMk1pMHVNREUxTERJdU1qSTRMREl1TWpJNExEQXNNQ3d4TERFdU1qSXpMVFF1TURsakxqQTROeXd3TEM0eE56VXVNREUxTGpJMk1pNHdNVFZhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3ROVEF5TGpFek9TQXRNak0zTGprMU1Ta25JR1pwYkd3OUp5VXlNMkpsTWpNNE5TY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTXZaeVV6UlNVelEyY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTVRFeUxqQXlOQ0ExTlM0NU9ETXBKeVV6UlNVelEzQmhkR2dnWkQwblRUYzROQzQ1TkRJc05ERTFMakk0TkVFeE5TNHpORElzTVRVdU16UXlMREFzTVN3d0xEYzJPUzQyTERNNU9TNDVOREpoTVRVdU16Y3lMREUxTGpNM01pd3dMREFzTUN3eE5TNHpORElzTVRVdU16UXlXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUYzJPUzQySUMwek9EUXVOaWtuSUdacGJHdzlKeVV5TXpZNE16aGhOQ2NnWm1sc2JDMXlkV3hsUFNkbGRtVnViMlJrSnk4bE0wVWxNME53WVhSb0lHUTlKMDA0TURRdU1UWTNMRFF6TVM0eU16UkJNVEl1TURZM0xERXlMakEyTnl3d0xERXNNQ3czT1RJdU1TdzBNVGt1TVRZM1lURXlMakE1TWl3eE1pNHdPVElzTUN3d0xEQXNNVEl1TURZM0xERXlMakEyTjFvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzAzT0RndU9ESTFJQzAwTURNdU9ESTFLU2NnWm1sc2JEMG5KVEl6TnprMFpHRmxKeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVGd4T1M0M01UZ3NORFEwTGpFek5tRTVMalF4T0N3NUxqUXhPQ3d3TERFc01DMDVMalF4T0MwNUxqUXhPQ3c1TGpRek15dzVMalF6TXl3d0xEQXNNQ3c1TGpReE9DdzVMalF4T0ZvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzA0TURRdU16YzJJQzAwTVRrdU16YzJLU2NnWm1sc2JEMG5KVEl6T1dVM1pXTTFKeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVGd5Tnk0eE5URXNORFV3TGpOQk9DNHhOVEVzT0M0eE5URXNNQ3d4TERBc09ERTVMRFEwTWk0eE5URmhPQzR4TmpZc09DNHhOallzTUN3d0xEQXNPQzR4TlRFc09DNHhOVEZhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RPREV4TGpnd09TQXROREkyTGpnd09Ta25JR1pwYkd3OUp5VXlNMlptWmljZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBNdlp5VXpSU1V6UTJjZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9ORFF1TVRNMElERXhOQzR4TWlrbkpUTkZKVE5EY0dGMGFDQmtQU2ROTXpBekxqazROQ3c0T0RndU1UUTNZUzQzTlRVdU56VTFMREFzTUN3eExDNHpPVE11TVdNdU1URTJMakEzTXl3eE15NDVOelF0Tnk0M056TXNNVFF1TURRM0xUY3VOalUyY3kweE15NDJNalVzT0M0eU1TMHhNeTQyTWpVc09DNHpOMkV1T0M0NExEQXNNU3d4TFRFdU5pd3dMQzQzT1M0M09Td3dMREFzTVN3dU56ZzJMUzQ0TVRWYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TXpBekxqRTVOeUF0T0RZMkxqVXpNU2tuSUdacGJHdzlKeVV5TTJabVl5Y2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMHpNRFF1T1RJMkxEa3pOQzQ1TlRKaExqWXlOaTQyTWpZc01Dd3hMREFzTUMweExqSTFNaTQyTWpFdU5qSXhMREFzTUN3d0xTNDJNall1TmpJMkxqWXpNUzQyTXpFc01Dd3dMREFzTGpZeU5pNDJNalphSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RNekEwTGpFek9TQXRPVEV4TGprd09Ta25JR1pwYkd3OUp5VXlNMlptTmljZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBOd1lYUm9JR1E5SjAwek1EVXVPREl5TERrek5pNHpORFJoTGpReU1pNDBNaklzTUN3eExEQXRMalF5TWkwdU5ESXlMalF5TWk0ME1qSXNNQ3d3TERBc0xqUXlNaTQwTWpKYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TXpBMUxqQTNPU0F0T1RFekxqUTBOeWtuSUdacGJHdzlKeVV5TTJaak1DY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMDBNalV1T1RRekxEYzVOaTR6TnpKakxqQXlPUzB1TURFMUxESXhMak0yT0MweE1pNDBNVFlzTWpFdU5DMHhNaTR6TnpOekxUSXhMakl3T0N3eE1pNDFPVEV0TWpFdU1qVXlMREV5TGpZeVl5MHVNamt4TGpFM05TMHVOREE0TFM0d09EY3RMakUwTmkwdU1qUTNXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUUXdOeTQ1TlRFZ0xUYzRNeTQ1T1RrcEp5Qm1hV3hzUFNjbE1qTm1abU1uSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5ETDJjbE0wVWxNME5uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtEY3VOemN6SURRdU1Ea3BKeVV6UlNVelEzQmhkR2dnWkQwblRUWTBNUzQ0TmpRc01URXhMakl4TTJFdU16WXVNellzTUN3d0xEQXNMak0yTkMwdU16WTBMak0wT0M0ek5EZ3NNQ3d3TERBdExqTTJOQzB1TXpRNUxqTTFOeTR6TlRjc01Dd3hMREFzTUN3dU56RXpXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUVTFOUzQ0T1RZZ0xUazRMalV3TmlrbklHWnBiR3c5SnlVeU0yWm1aaWNnWm1sc2JDMXlkV3hsUFNkbGRtVnViMlJrSnk4bE0wVWxNME53WVhSb0lHUTlKMDAwT0RBdU5UWTBMRGd4TGpZeU9HRXVNelkwTGpNMk5Dd3dMREVzTUMwdU16WTBMUzR6TmpRdU16Y3VNemNzTUN3d0xEQXNMak0yTkM0ek5qUmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE5ERTRMakEzTlNBdE56TXVNakUwS1NjZ1ptbHNiRDBuSlRJelptWm1KeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVFF4Tmk0ek5qUXNNamM1TGpJeU9HRXVNelkwTGpNMk5Dd3dMREVzTUMwdU16WTBMUzR6TmpRdU16Y3VNemNzTUN3d0xEQXNMak0yTkM0ek5qUmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE16WXpMakl5SUMweU5ESXVNRFV4S1NjZ1ptbHNiRDBuSlRJelptWm1KeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVFUxTkM0d05qUXNOVE13TGpBeU9HRXVNelkwTGpNMk5Dd3dMREVzTUMwdU16WTBMUzR6TmpRdU16Y3VNemNzTUN3d0xEQXNMak0yTkM0ek5qUmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE5EZ3dMamczTmlBdE5EVTJMak0wTlNrbklHWnBiR3c5SnlVeU0yWm1aaWNnWm1sc2JDMXlkV3hsUFNkbGRtVnViMlJrSnk4bE0wVWxNME53WVhSb0lHUTlKMDAwTWpFdU1qWTBMRFkxTWk0eU1UTmhMak0xTnk0ek5UY3NNQ3d3TERBc0xqTTJOQzB1TXpRNUxqTTNMak0zTERBc01Dd3dMUzR6TmpRdExqTTJOQzR6TlRjdU16VTNMREFzTVN3d0xEQXNMamN4TTFvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzB6TmpjdU5EQTJJQzAxTmpBdU56VTNLU2NnWm1sc2JEMG5KVEl6Wm1abUp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRUUTNNeTR4TmpRc05qWXlMakF5T0dFdU16WTBMak0yTkN3d0xERXNNQzB1TXpZMExTNHpOalF1TXpjdU16Y3NNQ3d3TERBc0xqTTJOQzR6TmpSYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TkRFeExqYzFNaUF0TlRZNUxqRXpNU2tuSUdacGJHdzlKeVV5TTJabVppY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMDJPRGN1T1RZMExEZzBOeTR4TWpoaExqTTJOQzR6TmpRc01Dd3hMREF0TGpNMk5DMHVNelkwTGpNMkxqTTJMREFzTUN3d0xDNHpOalF1TXpZMFdpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRVNU5TNHlPRFVnTFRjeU55NHlPRGNwSnlCbWFXeHNQU2NsTWpObVptWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5Oakl4TGpNMk5DdzRPVEV1TnpFellTNHpOaTR6Tml3d0xEQXNNQ3d1TXpZMExTNHpOalF1TXpRNExqTTBPQ3d3TERBc01DMHVNelkwTFM0ek5Ea3VNelUzTGpNMU55d3dMREVzTUN3d0xDNDNNVE5hSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3ROVE00TGpNNElDMDNOalV1TXprMUtTY2dabWxzYkQwbkpUSXpabVptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRFM09TNHlOalFzTmpnNUxqRXlPR0V1TXpZMExqTTJOQ3d3TERFc01DMHVNelkwTFM0ek5qUXVNemd1TXpnc01Dd3dMREFzTGpNMk5DNHpOalJhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RNVFl3TGpZek1pQXROVGt5TGpJNE5pa25JR1pwYkd3OUp5VXlNMlptWmljZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBOd1lYUm9JR1E5SjAwM09Ua3VNVFkwTERZME1pNHlNamhoTGpNMk5DNHpOalFzTUN3eExEQXRMak0yTkMwdU16WTBMak0yTGpNMkxEQXNNQ3d3TEM0ek5qUXVNelkwV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVFk1TUM0eU9Ua2dMVFUxTWk0eU1UTXBKeUJtYVd4c1BTY2xNak5tWm1ZbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk1UQXlPQzQzTmpRc056UTFMamt5T0dFdU16WTBMak0yTkN3d0xERXNNQzB1TXpZMExTNHpOalF1TXpjdU16Y3NNQ3d3TERBc0xqTTJOQzR6TmpSYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0T0RnMkxqUTNPQ0F0TmpRd0xqZ3hPQ2tuSUdacGJHdzlKeVV5TTJabVppY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMHhNalF6TGpZMk5DdzFORE11TkRJNFlTNHpOalF1TXpZMExEQXNNU3d3TFM0ek5qUXRMak0yTkM0ek5pNHpOaXd3TERBc01Dd3VNelkwTGpNMk5Gb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MweE1EY3dMakE1TnlBdE5EWTNMamM1TkNrbklHWnBiR3c5SnlVeU0yWm1aaWNnWm1sc2JDMXlkV3hsUFNkbGRtVnViMlJrSnk4bE0wVWxNME53WVhSb0lHUTlKMDB4TkRBeExqWTJOQ3d6TkRndU16STRZUzR6TmpRdU16WTBMREFzTVN3d0xTNHpOalF0TGpNMk5DNHpOeTR6Tnl3d0xEQXNNQ3d1TXpZMExqTTJORm9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMHhNakExTGpBNU9DQXRNekF4TGpBNU15a25JR1pwYkd3OUp5VXlNMlptWmljZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBOd1lYUm9JR1E5SjAweE16WXlMakUyTkN3eU5UUXVOVEk0WVM0ek5qUXVNelkwTERBc01Td3dMUzR6TmpRdExqTTJOQzR6Tmk0ek5pd3dMREFzTUN3dU16WTBMak0yTkZvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzB4TVRjeExqTTBPQ0F0TWpJd0xqazBOeWtuSUdacGJHdzlKeVV5TTJabVppY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMHhORGN6TGprME5Dd3lNRE11TmpFellTNHpOVGN1TXpVM0xEQXNNU3d3TERBdExqY3hNeTR6TkRndU16UTRMREFzTUN3d0xTNHpORGt1TXpZMExqTXpOaTR6TXpZc01Dd3dMREFzTGpNME9TNHpORGxhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RNVEkyTmk0NE5qa2dMVEUzTnk0ME5UWXBKeUJtYVd4c1BTY2xNak5tWm1ZbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk1UVTFNaTR6TmpRc01UazNMamN5T0dFdU16WTBMak0yTkN3d0xERXNNQzB1TXpZMExTNHpOalF1TXpZdU16WXNNQ3d3TERBc0xqTTJOQzR6TmpSYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TVRNek15NDROaklnTFRFM01pNDBNVFVwSnlCbWFXeHNQU2NsTWpObVptWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5NVFExTXk0ek5qUXNNVFUzTGpjeU9HRXVNelkwTGpNMk5Dd3dMREVzTUMwdU16WTBMUzR6TmpRdU16VXlMak0xTWl3d0xEQXNNQ3d1TXpZMExqTTJORm9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMHhNalE1TGpJM015QXRNVE00TGpJek55a25JR1pwYkd3OUp5VXlNMlptWmljZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBOd1lYUm9JR1E5SjAweE16QTFMak0yTkN3ek9TNDNNamhoTGpNMk5DNHpOalFzTUN3eExEQXRMak0yTkMwdU16WTBMak0zTGpNM0xEQXNNQ3d3TEM0ek5qUXVNelkwV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVEV4TWpJdU9ERTJJQzB6Tnk0ME1UTXBKeUJtYVd4c1BTY2xNak5tWm1ZbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk1UWTNNeTR6TmpRc016a3VOekk0WVM0ek5qUXVNelkwTERBc01Td3dMUzR6TmpRdExqTTJOQzR6Tnk0ek55d3dMREFzTUN3dU16WTBMak0yTkZvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzB4TkRNM0xqSTBPU0F0TXpjdU5ERXpLU2NnWm1sc2JEMG5KVEl6Wm1abUp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRURTJOak11TkRZMExESXlPUzQ0TWpoaExqTTJOQzR6TmpRc01Dd3hMREF0TGpNMk5DMHVNelkwTGpNMkxqTTJMREFzTUN3d0xDNHpOalF1TXpZMFdpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRFME1qZ3VOemtnTFRFNU9TNDRORElwSnlCbWFXeHNQU2NsTWpObVptWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5NVFV6T1M0NU5qUXNORGN4TGpneU9HRXVNelkwTGpNMk5Dd3dMREVzTUMwdU16WTBMUzR6TmpRdU16WXVNellzTUN3d0xEQXNMak0yTkM0ek5qUmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE1UTXlNeTR5TmpjZ0xUUXdOaTQyTVRZcEp5Qm1hV3hzUFNjbE1qTm1abVluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTVRZMU1TNHdOalFzTlRjNExqQXlPR0V1TXpZMExqTTJOQ3d3TERFc01DMHVNelkwTFM0ek5qUXVNemN1TXpjc01Dd3dMREFzTGpNMk5DNHpOalJhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RNVFF4T0M0eE9UVWdMVFE1Tnk0ek5UZ3BKeUJtYVd4c1BTY2xNak5tWm1ZbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk1UVTVNUzQ0TmpRc056VXpMalF4TTJFdU16WXVNellzTUN3d0xEQXNMak0yTkMwdU16WTBMak0wT0M0ek5EZ3NNQ3d3TERBdExqTTJOQzB1TXpRNUxqTTFOeTR6TlRjc01Dd3hMREFzTUN3dU56RXpXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xURXpOamN1TmpFeUlDMDJORGN1TWpJMktTY2dabWxzYkQwbkpUSXpabVptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRFeU56TXVNalkwTERjek9DNDFNamhoTGpNMk5DNHpOalFzTUN3eExEQXRMak0yTkMwdU16WTBMak0yTGpNMkxEQXNNQ3d3TEM0ek5qUXVNelkwV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVEV3T1RVdU16ZzRJQzAyTXpRdU5EazFLU2NnWm1sc2JEMG5KVEl6Wm1abUp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRURXhOREl1TXpZMExEZzFPUzQxTWpoaExqTTJOQzR6TmpRc01Dd3hMREF0TGpNMk5DMHVNelkwTGpNNExqTTRMREFzTUN3d0xDNHpOalF1TXpZMFdpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRrNE15NDFORElnTFRjek55NDRPRElwSnlCbWFXeHNQU2NsTWpObVptWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5NVEF5Tmk0ek5qUXNNVEl6TGpZeU9HRXVNelE0TGpNME9Dd3dMREFzTUN3dU16UTVMUzR6TmpRdU16VTNMak0xTnl3d0xERXNNQzB1TXpRNUxqTTJORm9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMDRPRFF1TkRJM0lDMHhNRGt1TVRBeEtTY2dabWxzYkQwbkpUSXpabVptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRFek1pNHpOalFzTlRJdU1ESTRZUzR6TkRndU16UTRMREFzTUN3d0xDNHpORGt0TGpNMk5DNHpOVGN1TXpVM0xEQXNNU3d3TFM0M01UTXNNQ3d1TXpjdU16Y3NNQ3d3TERBc0xqTTJOQzR6TmpSYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TVRJd0xqVTFPU0F0TkRjdU9USXpLU2NnWm1sc2JEMG5KVEl6Wm1abUp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRURTBOUzR5TERZeUxqUTVOR0V1TlRrdU5Ua3NNQ3d3TERBc0xqWXRMall1Tmk0MkxEQXNNQ3d3TFM0MkxTNDJMall3T1M0Mk1Ea3NNQ3d3TERBdExqWXVOaTQyTGpZc01Dd3dMREFzTGpZdU5sb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MweE16RXVNekkxSUMwMU5pNDBOamNwSnlCbWFXeHNQU2NsTWpObVptWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5NamM1TGpZc01qa3VNamswWVM0MkxqWXNNQ3d3TERBc0xqWXRMall1TmpBNUxqWXdPU3d3TERBc01DMHVOaTB1Tmk0MkxqWXNNQ3d3TERBdExqWXVOaTQxT1M0MU9Td3dMREFzTUN3dU5pNDJXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUSTBOaTR4TmpFZ0xUSTRMakVwSnlCbWFXeHNQU2NsTWpObVptWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5Nekk1TERjMkxqRTVOR0V1TmpBNUxqWXdPU3d3TERBc01Dd3VOaTB1Tmk0MkxqWXNNQ3d3TERBdExqWXRMall1Tmk0MkxEQXNNQ3d3TERBc01TNHhPVFJhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RNamc0TGpNM01TQXROamd1TVRjektTY2dabWxzYkQwbkpUSXpabVptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRZME1TNHpMRFV5TGpjNU5HRXVOaTQyTERBc01Dd3dMQzQyTFM0MkxqVTVMalU1TERBc01Dd3dMUzQyTFM0MkxqWXVOaXd3TERBc01Dd3dMREV1TVRrMFdpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRVMU5TNHlNVElnTFRRNExqRTNPU2tuSUdacGJHdzlKeVV5TTJabVppY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMHlOall1TkN3ek56VXVNemswWVM0MkxqWXNNQ3d3TERBc0xqWXRMall1TmpBNUxqWXdPU3d3TERBc01DMHVOaTB1Tmk0MkxqWXNNQ3d3TERBdExqWXVOaTQxT1M0MU9Td3dMREFzTUN3dU5pNDJXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUSXpOQzQ0T0RNZ0xUTXlNeTQ0TWpFcEp5Qm1hV3hzUFNjbE1qTm1abVluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTlRjeUxqWXNOekU0TGpZNU5HRXVOaTQyTERBc01Dd3dMQzQyTFM0MkxqWXdPUzQyTURrc01Dd3dMREF0TGpZdExqWXVOaTQyTERBc01Td3dMREFzTVM0eE9UUmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE5EazJMalV4TWlBdE5qRTNMakUxS1NjZ1ptbHNiRDBuSlRJelptWm1KeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVFUwTERnM05pNDJPVFJoTGpZdU5pd3dMREVzTUN3d0xURXVNVGswTGpZd09TNDJNRGtzTUN3d0xEQXRMall1Tmk0MkxqWXNNQ3d3TERBc0xqWXVObG9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMDFNeTQwSUMwM05USXVNVFV5S1NjZ1ptbHNiRDBuSlRJelptWm1KeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVEV3TURJdU15dzVNRGd1TnprMFlTNDFPUzQxT1N3d0xEQXNNQ3d1TmkwdU5pNDJMallzTUN3d0xEQXRMall0TGpZdU5qQTVMall3T1N3d0xEQXNNQzB1Tmk0MkxqVTVMalU1TERBc01Dd3dMQzQyTGpaYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0T0RZekxqWTJOQ0F0TnpjNUxqVTNPU2tuSUdacGJHdzlKeVV5TTJabVppY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMHhNVGt5TGprc05EYzBMakU1TkdFdU5pNDJMREFzTUN3d0xDNDJMUzQyTGpVNUxqVTVMREFzTUN3d0xTNDJMUzQyTGpZdU5pd3dMREVzTUN3d0xERXVNVGswV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVEV3TWpZdU5USWdMVFF3T0M0eU5Da25JR1pwYkd3OUp5VXlNMlptWmljZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBOd1lYUm9JR1E5SjAweE5UZzRMakVzTmpjekxqUTVOR0V1TlRrdU5Ua3NNQ3d3TERBc0xqWXRMall1Tmk0MkxEQXNNQ3d3TFM0MkxTNDJMall3T1M0Mk1Ea3NNQ3d3TERBdExqWXVOaTQyTGpZc01Dd3dMREFzTGpZdU5sb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MweE16WTBMakU1TlNBdE5UYzRMalV6S1NjZ1ptbHNiRDBuSlRJelptWm1KeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVGt6TlM0MExESXlNQzR3T1RSaExqWXVOaXd3TERBc01Dd3VOaTB1Tmk0MU9TNDFPU3d3TERBc01DMHVOaTB1Tmk0MkxqWXNNQ3d3TERBdExqWXVOaTQxT1M0MU9Td3dMREFzTUN3dU5pNDJXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUZ3dOaTQxTURJZ0xURTVNUzR4TWpjcEp5Qm1hV3hzUFNjbE1qTm1abVluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTVRVNE1pNDJMRFl6TGpRNU5HRXVOakE1TGpZd09Td3dMREFzTUN3dU5pMHVOaTQyTGpZc01Dd3hMREF0TVM0eE9UUXNNQ3d1TmpBNUxqWXdPU3d3TERBc01Dd3VOaTQyV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVEV6TlRrdU5EazFJQzAxTnk0ek1qSXBKeUJtYVd4c1BTY2xNak5tWm1ZbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk5qYzVMakkwTnl3ME5EWXVPVGsxWVM0eU5EY3VNalEzTERBc01Td3dMUzR5TkRjdExqSTBOeTR5TkRVdU1qUTFMREFzTUN3d0xDNHlORGN1TWpRM1dpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRVNE55NDVNemNnTFRNNE5TNDFPVGNwSnlCbWFXeHNQU2NsTWpObVptWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5OamMzTGpVME55d3hOakF1T1RrMVlTNHlOVFV1TWpVMUxEQXNNQ3d3TEM0eU5EY3RMakkwTnk0eU5EVXVNalExTERBc01Dd3dMUzR5TkRjdExqSTBOeTR5TkRjdU1qUTNMREFzTVN3d0xEQXNMalE1TlZvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzAxT0RZdU5EZzBJQzB4TkRFdU1qSTRLU2NnWm1sc2JEMG5KVEl6Wm1abUp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRUazJOUzR5TkRjc05qVXVOVGsxWVM0eU5UVXVNalUxTERBc01Dd3dMQzR5TkRjdExqSTBOeTR5TkRVdU1qUTFMREFzTUN3d0xTNHlORGN0TGpJME55NHlNemN1TWpNM0xEQXNNQ3d3TFM0eU5EY3VNalEzTGpJME5TNHlORFVzTUN3d0xEQXNMakkwTnk0eU5EZGFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE9ETXlMak13TmlBdE5Ua3VOekUwS1NjZ1ptbHNiRDBuSlRJelptWm1KeUJtYVd4c0xYSjFiR1U5SjJWMlpXNXZaR1FuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVEV6TVRVdU9UUTRMREk1Tnk0Mk9UVmhMakkwTnk0eU5EY3NNQ3d4TERBdExqSTBOeTB1TWpRM0xqSXpOeTR5TXpjc01Dd3dMREFzTGpJME55NHlORGRhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RNVEV6TVM0NU5UZ2dMVEkxT0M0d01qa3BKeUJtYVd4c1BTY2xNak5tWm1ZbklHWnBiR3d0Y25Wc1pUMG5aWFpsYm05a1pDY3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk1UVTJOUzR6TkRnc01qazNMalk1TldFdU1qVTFMakkxTlN3d0xEQXNNQ3d1TWpRM0xTNHlORGN1TWpRMUxqSTBOU3d3TERBc01DMHVNalEzTFM0eU5EY3VNalUxTGpJMU5Td3dMREFzTUMwdU1qUTRMakkwTnk0eU16Y3VNak0zTERBc01Dd3dMQzR5TkRndU1qUTNXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xURXpORFV1TURVMUlDMHlOVGd1TURJNUtTY2dabWxzYkQwbkpUSXpabVptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRFMk1qY3VNRFE0TERVeE55NDBPVFZoTGpJME55NHlORGNzTUN3d0xEQXNNQzB1TkRrMUxqSTBOeTR5TkRjc01Dd3hMREFzTUN3dU5EazFXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xURXpPVGN1TnpjMElDMDBORFV1T0RNMUtTY2dabWxzYkQwbkpUSXpabVptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRFd05ERXVOelE0TERVek55NHlPVFZoTGpJME55NHlORGNzTUN3d0xEQXNNQzB1TkRrMUxqSTBOeTR5TkRjc01Dd3hMREFzTUN3dU5EazFXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUZzVOeTQyTnpFZ0xUUTJNaTQzTlRNcEp5Qm1hV3hzUFNjbE1qTm1abVluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTVRFek9DNHhORGNzTnpJNUxqZzVOV0V1TWpRM0xqSTBOeXd3TERFc01DMHVNalEzTFM0eU5EY3VNalExTGpJME5Td3dMREFzTUN3dU1qUTNMakkwTjFvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzA1T0RBdU1ETTVJQzAyTWpjdU16RTRLU2NnWm1sc2JEMG5KVEl6Wm1abUp5Qm1hV3hzTFhKMWJHVTlKMlYyWlc1dlpHUW5MeVV6UlNVelEzQmhkR2dnWkQwblRUUXlOaTQ1TkRjc05EQTJMak01TldFdU1qUTNMakkwTnl3d0xERXNNQ3d3TFM0ME9UVXVNalUxTGpJMU5Td3dMREFzTUMwdU1qUTNMakkwTnk0eU5EVXVNalExTERBc01Dd3dMQzR5TkRjdU1qUTNXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUTTNNaTR6TmpJZ0xUTTFNQzQ1TURjcEp5Qm1hV3hzUFNjbE1qTm1abVluSUdacGJHd3RjblZzWlQwblpYWmxibTlrWkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTWpVMkxqUTBOeXd5TVRNdU1UazFZUzR5TkRjdU1qUTNMREFzTVN3d0xTNHlORGN0TGpJME55NHlORFV1TWpRMUxEQXNNQ3d3TEM0eU5EY3VNalEzV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVEl5Tmk0Mk9DQXRNVGcxTGpneU9Ta25JR1pwYkd3OUp5VXlNMlptWmljZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBOd1lYUm9JR1E5SjAweU5URXVOVFEzTERNek55NHlPVFZoTGpJME55NHlORGNzTUN3eExEQXRMakkwTnkwdU1qUTNMakkxTlM0eU5UVXNNQ3d3TERBc0xqSTBOeTR5TkRkYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TWpJeUxqUTVNeUF0TWpreExqZzJOU2tuSUdacGJHdzlKeVV5TTJabVppY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMHhOVGN1TnpRM0xEVXhNQzR3T1RWaExqSTBOeTR5TkRjc01Dd3dMREFzTUMwdU5EazFMakkwTlM0eU5EVXNNQ3d3TERBdExqSTBOeTR5TkRjdU1qTTNMakl6Tnl3d0xEQXNNQ3d1TWpRM0xqSTBOMW9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMHhOREl1TXpRM0lDMDBNemt1TlRFeUtTY2dabWxzYkQwbkpUSXpabVptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRJeE5DNHpORGNzTVRjMUxqRTVOV0V1TWpRMUxqSTBOU3d3TERBc01Dd3VNalEzTFM0eU5EY3VNalEzTGpJME55d3dMREFzTUMwdU5EazFMREFzTGpJME5TNHlORFVzTUN3d0xEQXNMakkwTnk0eU5EZGFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE1Ua3dMamN3T0NBdE1UVXpMak0yTVNrbklHWnBiR3c5SnlVeU0yWm1aaWNnWm1sc2JDMXlkV3hsUFNkbGRtVnViMlJrSnk4bE0wVWxNME53WVhSb0lHUTlKMDB6TnpBdU1UUXNNekl5TGpRNU5XRXVNalUxTGpJMU5Td3dMREFzTUN3dU1qUTNMUzR5TkRjdU1qUTFMakkwTlN3d0xEQXNNQzB1TWpRM0xTNHlORGN1TWpVMUxqSTFOU3d3TERBc01DMHVNalEzTGpJME55NHlNemN1TWpNM0xEQXNNQ3d3TEM0eU5EY3VNalEzV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVE15TXk0NE1qTWdMVEkzT1M0eU1pa25JR1pwYkd3OUp5VXlNMlptWmljZ1ptbHNiQzF5ZFd4bFBTZGxkbVZ1YjJSa0p5OGxNMFVsTTBOd1lYUm9JR1E5SjAweE9USXVOalEzTERnM01pNDJPVFZoTGpJME55NHlORGNzTUN3eExEQXRMakkwTnkwdU1qUTNMakkwTlM0eU5EVXNNQ3d3TERBc0xqSTBOeTR5TkRkYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TVRjeUxqRTJOeUF0TnpRNUxqTXpNaWtuSUdacGJHdzlKeVV5TTJabVppY2dabWxzYkMxeWRXeGxQU2RsZG1WdWIyUmtKeThsTTBVbE0wTndZWFJvSUdROUowMDFOREl1T1RRNExEa3pOeTR5T1RWaExqSTFOUzR5TlRVc01Dd3dMREFzTGpJME55MHVNalEzTGpJME5TNHlORFVzTUN3d0xEQXRMakkwTnkwdU1qUTNMakkxTlM0eU5UVXNNQ3d3TERBdExqSTBOeTR5TkRjdU1qUTFMakkwTlN3d0xEQXNNQ3d1TWpRM0xqSTBOMW9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMDBOekV1TkRjM0lDMDRNRFF1TlRJNUtTY2dabWxzYkQwbkpUSXpabVptSnlCbWFXeHNMWEoxYkdVOUoyVjJaVzV2WkdRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRFMk9URXVNalE0TERnNE1TNDVPVFZoTGpJME55NHlORGNzTUN3eExEQXRMakkwT0MwdU1qUTNMakkxTlM0eU5UVXNNQ3d3TERBc0xqSTBPQzR5TkRkYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TVRRMU1pNDJNamtnTFRjMU55NHlOemdwSnlCbWFXeHNQU2NsTWpObVptWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5NVE16TVM0ME5EZ3NOalEwTGpFNU5XRXVNalEzTGpJME55d3dMREFzTUN3d0xTNDBPVFV1TWpRM0xqSTBOeXd3TERBc01Dd3dMQzQwT1RWYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TVRFME5TNHlNRElnTFRVMU5DNHdPVE1wSnlCbWFXeHNQU2NsTWpObVptWW5JR1pwYkd3dGNuVnNaVDBuWlhabGJtOWtaQ2N2SlRORkpUTkRMMmNsTTBVbE0wTXZjM1puSlRORlhDSXBPMXh1WEhSamRYSnpiM0k2SUhWeWJDZ25aR0YwWVRwcGJXRm5aUzl6ZG1jcmVHMXNPM1YwWmpnc1BITjJaeUI0Yld4dWN6MWNJbWgwZEhBNkx5OTNkM2N1ZHpNdWIzSm5Mekl3TURBdmMzWm5YQ0lnZDJsa2RHZzlYQ0kwTUZ3aUlHaGxhV2RvZEQxY0lqUXdYQ0lnZG1sbGQwSnZlRDFjSWpBZ01DQTBNQ0EwTUZ3aVBqeG5JSFJ5WVc1elptOXliVDFjSW5SeVlXNXpiR0YwWlNndE9EUTBJQzAxTURBcFhDSStQR2NnZEhKaGJuTm1iM0p0UFZ3aWRISmhibk5zWVhSbEtEZzBOQ0F0TlRJd0xqTTJLVndpUGp4d1lYUm9JR1E5WENKTk1UazBMamM0Tnl3eE1qRXlMakk1WVRJdU9EVTRMREl1T0RVNExEQXNNU3d3TERJdU9EVTRMREl1T0RVNExESXVPRFk1TERJdU9EWTVMREFzTUN3d0xUSXVPRFU0TFRJdU9EVTRXbHdpSUhSeVlXNXpabTl5YlQxY0luUnlZVzV6YkdGMFpTZ3RNVGMwTGpjNU1pQXRNVGMwTGpjNU15bGNJaUJtYVd4c1BWd2lKVEl6T0RZNE5qZzJYQ0l2UGp4d1lYUm9JR1E5WENKTk1qQTVMalF4Tml3eE1qSTRMak0xWVRFdU5ESTVMREV1TkRJNUxEQXNNU3d4TFRFdU5ESTBMREV1TkRJMExERXVOREU1TERFdU5ERTVMREFzTUN3eExERXVOREkwTFRFdU5ESTBXbHdpSUhSeVlXNXpabTl5YlQxY0luUnlZVzV6YkdGMFpTZ3RNVGc1TGpReU1TQXRNVGc1TGpReE9TbGNJaUJtYVd4c1BWd2lKVEl6Wm1ZMk5UVmlYQ0l2UGp4bklIUnlZVzV6Wm05eWJUMWNJblJ5WVc1emJHRjBaU2d3SURFd01qQXVNellwWENJK1BIQmhkR2dnWkQxY0lrMHlNVFl1TURJMExERXdNakF1TXpaMk1USXVPRFUxYURFdU5ESTBWakV3TWpBdU16WmFYQ0lnZEhKaGJuTm1iM0p0UFZ3aWRISmhibk5zWVhSbEtDMHhPVFl1TnpNMklDMHhNREl3TGpNMktWd2lJR1pwYkd3OVhDSWxNak00TmpnMk9EWmNJaTgrUEhCaGRHZ2daRDFjSWsweU1UWXVNREkwTERFek1qUXVNaloyTVRJdU9EWTJhREV1TkRJMFZqRXpNalF1TWpaYVhDSWdkSEpoYm5ObWIzSnRQVndpZEhKaGJuTnNZWFJsS0MweE9UWXVOek0ySUMweE1qazNMakV5TmlsY0lpQm1hV3hzUFZ3aUpUSXpPRFk0TmpnMlhDSXZQanh3WVhSb0lHUTlYQ0pOTXpBMExqQXhOaXd4TWpNMkxqSTNkakV1TkRNMGFERXlMamcxTlhZdE1TNDBNelJhWENJZ2RISmhibk5tYjNKdFBWd2lkSEpoYm5Oc1lYUmxLQzB5TnpZdU9EY3hJQzB4TWpFMkxqazVNaWxjSWlCbWFXeHNQVndpSlRJek9EWTROamcyWENJdlBqeHdZWFJvSUdROVhDSk5NQ3d4TWpNMkxqSTNkakV1TkRNMFNERXlMamcxTlhZdE1TNDBNelJhWENJZ2RISmhibk5tYjNKdFBWd2lkSEpoYm5Oc1lYUmxLREFnTFRFeU1UWXVPVGt5S1Z3aUlHWnBiR3c5WENJbE1qTTROamcyT0RaY0lpOCtQQzluUGp4bklIUnlZVzV6Wm05eWJUMWNJblJ5WVc1emJHRjBaU2c0TGpnMk1TQXhNREk1TGpJeE5pbGNJajQ4Y0dGMGFDQmtQVndpVFRJME5DNDFMREV4TVRrdU5UUTRZUzQzTVRRdU56RTBMREFzTUN3d0xTNHhNaXd4TGpRd09Td3hNQ3d4TUN3d0xEQXNNU3czTGpRc055NHpPVEV1TnpFMUxqY3hOU3d3TERBc01Dd3hMak01TVMwdU16TjJNR0V4TVM0ME16RXNNVEV1TkRNeExEQXNNQ3d3TFRndU5EVTBMVGd1TkRRekxqY3hPQzQzTVRnc01Dd3dMREF0TGpJeE1pMHVNREl6V2x3aUlIUnlZVzV6Wm05eWJUMWNJblJ5WVc1emJHRjBaU2d0TWpNd0xqa3hPQ0F0TVRFeE9TNDFORGNwWENJZ1ptbHNiRDFjSWlVeU16ZzJPRFk0Tmx3aUx6NDhjR0YwYUNCa1BWd2lUVEV3Tnk0NU56RXNNVEV4T1M0MU9EbGhMamN5TVM0M01qRXNNQ3d3TERBdExqRTVMakF5TXl3eE1TNDBNamdzTVRFdU5ESTRMREFzTUN3d0xUZ3VORFFzT0M0ME1qY3VOekUwTGpjeE5Dd3dMREFzTUN3eExqTTNPUzR6Tmpsak1DMHVNREV1TURBMUxTNHdNakV1TURBNExTNHdNekZoTVRBc01UQXNNQ3d3TERFc055NHpPRFl0Tnk0ek56Y3VOekUwTGpjeE5Dd3dMREFzTUMwdU1UUXlMVEV1TkRBNVdsd2lJSFJ5WVc1elptOXliVDFjSW5SeVlXNXpiR0YwWlNndE9Ua3VNekVnTFRFeE1Ua3VOVGcyS1Z3aUlHWnBiR3c5WENJbE1qTTROamcyT0RaY0lpOCtQSEJoZEdnZ1pEMWNJazB5TlRJdU5EQTNMREV5TmpRdU16TTRZUzQzTVRRdU56RTBMREFzTUN3d0xTNDNNVEl1TlRVMUxERXdMREV3TERBc01Dd3hMVGN1TXpnMkxEY3VNemd1TnpFMExqY3hOQ3d3TERBc01Dd3VNamd5TERFdU5Hd3VNRFV6TFM0d01UTmhNVEV1TkRNc01URXVORE1zTUN3d0xEQXNPQzQwTkMwNExqUXlPUzQzTVRNdU56RXpMREFzTUN3d0xTNDJOemd0TGpnNU0xcGNJaUIwY21GdWMyWnZjbTA5WENKMGNtRnVjMnhoZEdVb0xUSXpNQzQ0TXpVZ0xURXlOVEV1TkRFcFhDSWdabWxzYkQxY0lpVXlNemcyT0RZNE5sd2lMejQ4Y0dGMGFDQmtQVndpVFRrNUxqa3lOQ3d4TWpZMExqQTNOMkV1TnpFMExqY3hOQ3d3TERBc01DMHVOalUyTGpnNUxERXhMalF6TVN3eE1TNDBNekVzTUN3d0xEQXNPQzQwTkN3NExqUTFOQzQzTVRVdU56RTFMREFzTUN3d0xDNHpNelV0TVM0ek9XZ3dZVGt1T1RrMUxEa3VPVGsxTERBc01Dd3hMVGN1TXpnMkxUY3VOQzQzTVRRdU56RTBMREFzTUN3d0xTNDNNelF0TGpVMU9HZ3dXbHdpSUhSeVlXNXpabTl5YlQxY0luUnlZVzV6YkdGMFpTZ3RPVGt1TWpRMklDMHhNalV4TGpFM01pbGNJaUJtYVd4c1BWd2lKVEl6T0RZNE5qZzJYQ0l2UGp3dlp6NDhaeUIwY21GdWMyWnZjbTA5WENKMGNtRnVjMnhoZEdVb01pQXhNREl5TGpNMktWd2lJR1pwYkd3OVhDSnViMjVsWENJZ2MzUnliMnRsUFZ3aUpUSXpOekEzTURjd1hDSWdjM1J5YjJ0bExYZHBaSFJvUFZ3aU1sd2lQanhqYVhKamJHVWdZM2c5WENJeE9Gd2lJR041UFZ3aU1UaGNJaUJ5UFZ3aU1UaGNJaUJ6ZEhKdmEyVTlYQ0p1YjI1bFhDSXZQanhqYVhKamJHVWdZM2c5WENJeE9Gd2lJR041UFZ3aU1UaGNJaUJ5UFZ3aU1UZGNJaUJtYVd4c1BWd2libTl1WlZ3aUx6NDhMMmMrUEM5blBqd3ZaejQ4TDNOMlp6NG5LU0F4TmlBeE5pd2dZWFYwYnp0Y2JuMWNiaTVuWm5nZ2UxeHVYSFJ3YjNOcGRHbHZianBoWW5OdmJIVjBaVHRjYmx4MGIzQmhZMmwwZVRveE8xeHVYSFIwY21GdWMybDBhVzl1T2lCdmNHRmphWFI1SURBdU5uTTdYRzU5WEc1Y2JpNW5abmd1WVdOMGFYWmxJSHRjYmx4MGIzQmhZMmwwZVRvd08xeHVmVnh1WEc0dVlYTjBaWEp2YVdRZ2UxeHVYSFIzYVdSMGFEbzBNSEI0TzF4dVhIUm9aV2xuYUhRNk5EQndlRHRjYmx4MFltRmphMmR5YjNWdVpDMXBiV0ZuWlRvZ2RYSnNLRndpWkdGMFlUcHBiV0ZuWlM5emRtY3JlRzFzTENVelEzTjJaeUI0Yld4dWN6MG5hSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY25JSGRwWkhSb1BTYzJNQ2NnYUdWcFoyaDBQU2MyTUNjZ2RtbGxkMEp2ZUQwbk1DQXdJRFl3SURZd0p5VXpSU1V6UTJjZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9NQ0F3S1NjbE0wVWxNME53WVhSb0lHUTlKMDB5TXpBdU9UazBMREV4TGpjME1pd3lNakV1T0RZM0xESXlMalIyTWtFeE5DNDJOekVzTVRRdU5qY3hMREFzTUN3d0xESXpOaTR6TERFeUxqTTJOaXd5TlM0M05ERXNNalV1TnpReExEQXNNQ3d3TERJek1DNDVPVFFzTVRFdU56UXlXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xURTVOUzQ0TmpjZ0xURXdMak0yTmlrbklHWnBiR3c5SnlVeU16UmhPR1JqTmljdkpUTkZKVE5EY0dGMGFDQmtQU2ROTVRRMkxqRTNPU3d4TVM0NU9EUnNMakF6TlMwdU1qWTRZVE14TGprM05pd3pNUzQ1TnpZc01Dd3dMREF0TWpBdU16Z3hMRGN1TkN3eE5DNDJNelVzTVRRdU5qTTFMREFzTUN3d0xERXhMakkxTkN3MUxqSTJNbll0TWtNeE5ERXVOVFlzTWpJdU16YzFMREUwTlM0ek9ETXNNVGdzTVRRMkxqRTNPU3d4TVM0NU9EUmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE1URXhMakE0T0NBdE1UQXVNelFwSnlCbWFXeHNQU2NsTWpNM04yRmhaRFFuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVEkwTVM0d05Ua3NNalF1TWpJeFFURXdMalkyTXl3eE1DNDJOak1zTUN3d0xEQXNNak16TGprc055NDBOREZoTWpJdU1UWTNMREl5TGpFMk55d3dMREFzTUMwNExqUTNNaTAwTGpreE0yTXVNREV4TFM0d05UY3VNREl5TFM0eE1UUXVNRE16TFM0eE56RmhNaXd5TERBc01Dd3dMVE11T1RNMkxTNDNNVE1zTVRJdU5qSXhMREV5TGpZeU1Td3dMREFzTVMweExqTTFNeXd6TGpneWJDMHhNaTQ0TVN3MU1TNDRPRFpoTVRBdU5qWXpMREV3TGpZMk15d3dMREFzTUN3eE55NHhOemd0TkM0M01Ua3NNelV1TVRnNExETTFMakU0T0N3d0xEQXNNQ3cwTGpVM05pMHpMak16T1N3MExqWTJOaXcwTGpZMk5pd3dMREFzTUN3MUxqSXROUzQxTURaQk16RXVPQ3d6TVM0NExEQXNNQ3d3TERJME1TNHdOVGtzTWpRdU1qSXhXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xURTRNeTR3TmpRZ01Da25JR1pwYkd3OUp5VXlNMkUxWXpabE15Y3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk5UTXVPVEUwTERZM0xqaGpMalV5T0MwMkxqSTFPUzB4TGpNM01pMHhNUzQ1TFRVdU16VXhMVEUxTGpnM05VRXhPQzQ1TVRjc01UZ3VPVEUzTERBc01Dd3dMRE0zTGpFeExEUTJMall4T1dFeE1pNDJOeklzTVRJdU5qY3lMREFzTUN3eExUSXdMamd6TERJdU1ESTJMRElzTWl3d0xERXNNQzB6TGpBMk9Dd3lMalUyTjJ3dU1ERTJMakF4T1hFdExqWTFOeTQyTFRFdU1qa3pMREV1TWpJNVlUTTFMamMwTkN3ek5TNDNORFFzTUN3d0xEQXROQzR4Tnpjc05TNHdNVGRCTVRJdU5qY3lMREV5TGpZM01pd3dMREFzTUN3eUxqQXhNeXczTmk0d01Ea3NNak11TVN3eU15NHhMREFzTUN3d0xEZ3VOakE0TERreExqa3hOaXd5TXk0d05qUXNNak11TURZMExEQXNNQ3d3TERJMExqTXNPVGd1TlRBMVlUVXhMamN6T0N3MU1TNDNNemdzTUN3d0xEQXNNakF1T1RNMkxURXlMamM0UVRJNUxqQTNNaXd5T1M0d056SXNNQ3d3TERBc05UTXVPVEUwTERZM0xqaGFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNnd0lDMDBNUzR4TlRZcEp5Qm1hV3hzUFNjbE1qTmtNbVV6WmpFbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRJMk55NHpOemdzTXpZMExqQTRPWFl4TXk0ek16TmhOaTQyTmpjc05pNDJOamNzTUN3d0xEQXNNQzB4TXk0ek16TmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE1qTTJMakEwTlNBdE16SXhMalF5TXlrbklHWnBiR3c5SnlVeU16UmhPR1JqTmljdkpUTkZKVE5EY0dGMGFDQmtQU2ROTWpFNUxqZ3lNU3d6TnpBdU56VTJZekF0TXk0Mk9ESXRNUzR4T1RRdE5pNDJOamN0TWk0Mk5qY3ROaTQyTmpkaE5pNDJOamNzTmk0Mk5qY3NNQ3d3TERBc01Dd3hNeTR6TXpORE1qRTRMall5T0N3ek56Y3VOREl5TERJeE9TNDRNakVzTXpjMExqUXpPQ3d5TVRrdU9ESXhMRE0zTUM0M05UWmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE1UZzFMamd5TVNBdE16SXhMalF5TXlrbklHWnBiR3c5SnlVeU16YzNZV0ZrTkNjdkpUTkZKVE5EY0dGMGFDQmtQU2ROTkRJd0xqazNPQ3c1Tmk0M01URjJNVE11TXpNellUWXVOalkzTERZdU5qWTNMREFzTUN3d0xEQXRNVE11TXpNeldpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRNM01TNDJORFVnTFRnMUxqTTNPQ2tuSUdacGJHdzlKeVV5TXpSaE9HUmpOaWN2SlRORkpUTkRjR0YwYUNCa1BTZE5NemN6TGpReU1Td3hNRE11TXpjNFl6QXRNeTQyT0RJdE1TNHhPVFF0Tmk0Mk5qY3RNaTQyTmpjdE5pNDJOamRoTmk0Mk5qY3NOaTQyTmpjc01Dd3hMREFzTUN3eE15NHpNek5ETXpjeUxqSXlPQ3d4TVRBdU1EUTBMRE0zTXk0ME1qRXNNVEEzTGpBMkxETTNNeTQwTWpFc01UQXpMak0zT0ZvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzB6TWpFdU5ESXhJQzA0TlM0ek56Z3BKeUJtYVd4c1BTY2xNak0zTjJGaFpEUW5MeVV6UlNVelEyY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTVRVdU5qWTNJREkxS1NjbE0wVWxNME5qYVhKamJHVWdZM2c5SnpFbklHTjVQU2N4SnlCeVBTY3hKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNneE15NHpNek1nTkNrbklHWnBiR3c5SnlVeU0yRTFZelpsTXljdkpUTkZKVE5EWTJseVkyeGxJR040UFNjeEp5QmplVDBuTVNjZ2NqMG5NU2NnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb01UY3VNek16S1NjZ1ptbHNiRDBuSlRJellUVmpObVV6Snk4bE0wVWxNME5qYVhKamJHVWdZM2c5SnpFbklHTjVQU2N4SnlCeVBTY3hKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNneU9DQXhNaTQyTmpjcEp5Qm1hV3hzUFNjbE1qTmhOV00yWlRNbkx5VXpSU1V6UTJOcGNtTnNaU0JqZUQwbk1TY2dZM2s5SnpFbklISTlKekVuSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtEQWdNalF1TmpZM0tTY2dabWxzYkQwbkpUSXpZVFZqTm1Vekp5OGxNMFVsTTBNdlp5VXpSU1V6UTNCaGRHZ2daRDBuVFRFd09DNHdPRGtzTVRZMExqazNPSFl4Tnk0ek16TmhPQzQyTmpjc09DNDJOamNzTUN3eExEQXNNQzB4Tnk0ek16TmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE9UVXVOREl5SUMweE5EVXVOalExS1NjZ1ptbHNiRDBuSlRJek5HRTRaR00ySnk4bE0wVWxNME53WVhSb0lHUTlKMDAwTnk0ME5qWXNNVGN6TGpZME5HTXdMVFF1TnpnMkxUSXVNRGc1TFRndU5qWTNMVFF1TmpZM0xUZ3VOalkzWVRndU5qWTNMRGd1TmpZM0xEQXNNU3d3TERBc01UY3VNek16UXpRMUxqTTNOeXd4T0RJdU16RXNORGN1TkRZMkxERTNPQzQwTXl3ME55NDBOallzTVRjekxqWTBORm9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMHpNQzR4TXpNZ0xURTBOUzQyTkRRcEp5Qm1hV3hzUFNjbE1qTTNOMkZoWkRRbkx5VXpSU1V6UXk5bkpUTkZKVE5ETDNOMlp5VXpSVndpS1R0Y2JseDBZbUZqYTJkeWIzVnVaQzF6YVhwbE9tTnZiblJoYVc0N1hHNWNkR0poWTJ0bmNtOTFibVF0Y21Wd1pXRjBPbTV2TFhKbGNHVmhkRHRjYm4xY2JpNXpjR0ZqWlhOb2FYQWdlMXh1WEhSM2FXUjBhRG96Tm5CNE8xeHVYSFJvWldsbmFIUTZORFp3ZUR0Y2JseDBZbUZqYTJkeWIzVnVaQzFwYldGblpUb2dkWEpzS0Z3aVpHRjBZVHBwYldGblpTOXpkbWNyZUcxc0xDVXpRM04yWnlCNGJXeHVjejBuYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNuSUhkcFpIUm9QU2N5Tmk0ek5ESW5JR2hsYVdkb2REMG5NelluSUhacFpYZENiM2c5SnpBZ01DQXlOaTR6TkRJZ016WW5KVE5GSlRORFp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TVRJekxqVTRNeUF3S1NjbE0wVWxNME53WVhSb0lHUTlKMDB4TXpZdU56VTFMREUxTUM0d05qTnNMVEV5TGpVeE1pd3hNQzR3TVdFeExqYzFOaXd4TGpjMU5pd3dMREFzTUMwdU5qVTVMREV1TXpjeGRqUXVOREkwYkRFekxqRTNNUzB5TGpZek5Dd3hNeTR4TnpFc01pNDJNelIyTFRRdU5ESTBZVEV1TnpVMkxERXVOelUyTERBc01Dd3dMUzQyTlRrdE1TNHpOekZhSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RNQzR3TURFZ0xURXpOUzR4TXpjcEp5Qm1hV3hzUFNjbE1qTm1aalkwTmpRbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRJeU1DNDJNVFlzTXpFekxqRXpPR3d0TVM0d05EUXROQzR4Tnpkb0xUWXVOalJzTFRFdU1EUTBMRFF1TVRjM1lTNDROemd1T0RjNExEQXNNQ3d3TEM0NE5USXNNUzR3T1RGb055NHdNalZoTGpnM09DNDROemdzTUN3d0xEQXNMamcxTWkweExqQTVNVm9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMDNPUzQwT1RnZ0xUSTNPQzR5TXlrbklHWnBiR3c5SnlVeU16azFPV05pTXljdkpUTkZKVE5EY0dGMGFDQmtQU2ROTWpFMExqVXlNeXd6TVRNdU1UTTRiREV1TURRMExUUXVNVGMzYUMweUxqWXpOR3d0TVM0d05EUXNOQzR4TnpkaExqZzNPQzQ0Tnpnc01Dd3dMREFzTGpnMU1pd3hMakE1TVdneUxqWXpOR0V1T0RjNExqZzNPQ3d3TERBc01TMHVPRFV5TFRFdU1Ea3hXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUYzVMalE1T0NBdE1qYzRMakl6S1NjZ1ptbHNiRDBuSlRJek56QTNORGczSnk4bE0wVWxNME53WVhSb0lHUTlKMDB5TURjdU5UWTVMalF5T1N3eU1ETXVORGdzTnk0M016WmhNeTQxTVRNc015NDFNVE1zTUN3d0xEQXRMalEwTnl3eExqY3hOVll6TUM0M016SmhNUzQzTlRZc01TNDNOVFlzTUN3d0xEQXNNUzQzTlRZc01TNDNOVFpvTnk0d01qVmhNUzQzTlRZc01TNDNOVFlzTUN3d0xEQXNNUzQzTlRZdE1TNDNOVFpXT1M0ME5XRXpMalV4TVN3ekxqVXhNU3d3TERBc01DMHVORFEzTFRFdU56RTFUREl3T1M0d016UXVOREk1UVM0NE16a3VPRE01TERBc01Dd3dMREl3Tnk0MU5qa3VOREk1V2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVGN4TGpVME55QXdLU2NnWm1sc2JEMG5KVEl6WlRSbFlXWTJKeThsTTBVbE0wTndZWFJvSUdROUowMHlNRFl1TlRRMUxETXdMamM0TVZZNUxqVmhOeTQyTlRnc055NDJOVGdzTUN3d0xERXNMakU0TmkweExqY3hOV3d4TGpjdE55NHpNRGRoTVM0eE1URXNNUzR4TVRFc01Dd3dMREVzTGpFMU55MHVNemN4TGpnek15NDRNek1zTUN3d0xEQXRNUzR3TWpNdU16Y3hUREl3TXk0ME9DdzNMamM0TldFekxqVXhNeXd6TGpVeE15d3dMREFzTUMwdU5EUTNMREV1TnpFMVZqTXdMamM0TVdFeExqYzFOaXd4TGpjMU5pd3dMREFzTUN3eExqYzFOaXd4TGpjMU5tZ3lMalE0T0VNeU1EWXVPRGN6TERNeUxqVXpOeXd5TURZdU5UUTFMRE14TGpjMU1Td3lNRFl1TlRRMUxETXdMamM0TVZvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzAzTVM0MU5EY2dMVEF1TURRNUtTY2dabWxzYkQwbkpUSXpZemRqWm1VeUp5OGxNMFVsTTBOd1lYUm9JR1E5SjAweU1Ea3VNRE0xTGpRellTNDRNemt1T0RNNUxEQXNNQ3d3TFRFdU5EWTBMREJzTFRRdU1EZzVMRGN1TXpBM1lUTXVOVEV6TERNdU5URXpMREFzTUN3d0xTNDBORGNzTVM0M01UVjJOQzQyYURFd0xqVXpOM1l0TkM0MllUTXVOVEV4TERNdU5URXhMREFzTUN3d0xTNDBORGN0TVM0M01UVmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE56RXVOVFE0SUMwd0xqQXdNU2tuSUdacGJHdzlKeVV5TTJabU5qUTJOQ2N2SlRORkpUTkRjR0YwYUNCa1BTZE5NakEyTGpVME5pdzVMalV4TW1FM0xqWTFPQ3czTGpZMU9Dd3dMREFzTVN3dU1UZzJMVEV1TnpFMWJERXVOeTAzTGpNd04yRXhMakV4TVN3eExqRXhNU3d3TERBc01Td3VNVFUzTFM0ek56RXVPRFl1T0RZc01Dd3dMREF0TGpVMU15MHVNREV5WXkwdU1ERXpMREF0TGpBeU5pNHdNVEV0TGpBek9TNHdNVFpoTGpneE1pNDRNVElzTUN3d0xEQXRMakU1TXk0eE1EWmpMUzR3TVRrdU1ERTBMUzR3TXpndU1ESTNMUzR3TlRZdU1EUXpZUzQ0TWpFdU9ESXhMREFzTUN3d0xTNHhPREl1TWpFNFRESXdNeTQwT0RFc055NDRZVE11TlRFekxETXVOVEV6TERBc01Dd3dMUzQwTkRjc01TNDNNVFYyTkM0MmFETXVOVEV5V2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVGN4TGpVME9DQXRNQzR3TmpFcEp5Qm1hV3hzUFNjbE1qTmtNalUxTldFbkx5VXpSU1V6UTNCaGRHZ2daRDBuVFRJeE15NDFOekVzTVRReExqSXpOVWd5TURNdU1ETTBkakV1TnpVMmFESXVNalV5WVRNdU5EWTVMRE11TkRZNUxEQXNNQ3d3TERZdU1ETTBMREJvTWk0eU5USjJMVEV1TnpVMldpY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTFRjeExqVTBPQ0F0TVRJM0xqRTROeWtuSUdacGJHdzlKeVV5TTJNM1kyWmxNaWN2SlRORkpUTkRZMmx5WTJ4bElHTjRQU2N4TGpjMU5pY2dZM2s5SnpFdU56VTJKeUJ5UFNjeExqYzFOaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb01UTTBMams1T1NBeE1pNHlPVElwSnlCbWFXeHNQU2NsTWpNMVlqVmtObVVuTHlVelJTVXpRM0JoZEdnZ1pEMG5UVEl3Tmk0MU5EWXNNVFEwTGpJMk5uWXRNeTR3TXpKb0xUTXVOVEV5ZGpFdU56VTJhREl1TWpVeVFUTXVOVFV4TERNdU5UVXhMREFzTUN3d0xESXdOaTQxTkRZc01UUTBMakkyTmxvbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzAzTVM0MU5EZ2dMVEV5Tnk0eE9EWXBKeUJtYVd4c1BTY2xNak5oWm1JNVpESW5MeVV6UlNVelEzQmhkR2dnWkQwblRUSXhPUzQyTnpjdU5ESTViQzB6TGpJc05TNDNNVFpvTnk0NE5qTnNMVE11TWkwMUxqY3hOa0V1T0RNNUxqZ3pPU3d3TERBc01Dd3lNVGt1TmpjM0xqUXlPVm9uSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtDMDRNeTQyTlRVZ01Da25JR1pwYkd3OUp5VXlNemN3TnpRNE55Y3ZKVE5GSlRORGNHRjBhQ0JrUFNkTk1qRTVMakl4TVN3MkxqSXdOaXd5TWpBdU5UUTBMalE0T1VFeExqRXhNU3d4TGpFeE1Td3dMREFzTVN3eU1qQXVOeTR4TVRoaExqZzJMamcyTERBc01Dd3dMUzQxTlRNdExqQXhNbXd0TGpBeE1Td3dMUzR3TWpndU1ERXhZUzQ0TVRJdU9ERXlMREFzTUN3d0xTNHhPVE11TVRBMmJDMHVNREl1TURFMVl5MHVNREV5TGpBd09TMHVNREkxTGpBeE9DMHVNRE0zTGpBeU9HRXVPREl6TGpneU15d3dMREFzTUMwdU1UZ3lMakl4T0d3dE15NHlMRFV1TnpFMmFESXVOek15V2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVGd6TGpZMU5pQXRNQzR3TmlrbklHWnBiR3c5SnlVeU16VmlOV1EyWlNjdkpUTkZKVE5EWnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3hNak11TlRneklESTFMalEyTXlrbkpUTkZKVE5EY0dGMGFDQmtQU2ROTVRJekxqVTROQ3d5TmpFdU1qWTBiRGN1T1MweExqVTRNVll5TlRac0xUY3VPU3d5TGpFd04xb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0MweE1qTXVOVGcwSUMweU5UVXVPVGsyS1NjZ1ptbHNiRDBuSlRJelpESTFOVFZoSnk4bE0wVWxNME53WVhSb0lHUTlKMDB6TVRZdU9EY3NNall4TGpJMk5Hd3ROeTQ1TFRFdU5UZ3hWakkxTm13M0xqa3NNaTR4TURkYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TWprd0xqVXlOeUF0TWpVMUxqazVOaWtuSUdacGJHdzlKeVV5TTJReU5UVTFZU2N2SlRORkpUTkRMMmNsTTBVbE0wTm5JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0RFeU15NDFPRE1nTWpVdU5EWXpLU2NsTTBVbE0wTndZWFJvSUdROUowMHhNalF1TkRZeUxESTJOQzQ0TWpSb01HRXVPRGM0TGpnM09Dd3dMREFzTUMwdU9EYzRMamczT0hZM0xqQXlOV0V1T0RjNExqZzNPQ3d3TERBc01Dd3VPRGM0TGpnM09HZ3dZUzQ0TnpndU9EYzRMREFzTUN3d0xDNDROemd0TGpnM09GWXlOalV1TjBFdU9EYzRMamczT0N3d0xEQXNNQ3d4TWpRdU5EWXlMREkyTkM0NE1qUmFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNndE1USXpMalU0TkNBdE1qWXpMamswTmlrbklHWnBiR3c5SnlVeU0yRm1ZamxrTWljdkpUTkZKVE5EY0dGMGFDQmtQU2ROTVRVNUxqYzNNeXd5TlRab01HRXVPRGM0TGpnM09Dd3dMREFzTUMwdU9EYzRMamczT0hZMExqTTVZUzQ0TnpndU9EYzRMREFzTUN3d0xDNDROemd1T0RjNGFEQmhMamczT0M0NE56Z3NNQ3d3TERBc0xqZzNPQzB1T0RjNGRpMDBMak01UVM0NE56Z3VPRGM0TERBc01Dd3dMREUxT1M0M056TXNNalUyV2ljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9MVEUxTlM0ek9ETWdMVEkxTlM0NU9UWXBKeUJtYVd4c1BTY2xNak5oWm1JNVpESW5MeVV6UlNVelEzQmhkR2dnWkQwblRUTTNNUzQyTXprc01qWTBMamd5Tkdnd1lTNDROemd1T0RjNExEQXNNQ3d4TEM0NE56Z3VPRGM0ZGpjdU1ESTFZUzQ0TnpndU9EYzRMREFzTUN3eExTNDROemd1T0RjNGFEQmhMamczT0M0NE56Z3NNQ3d3TERFdExqZzNPQzB1T0RjNFZqSTJOUzQzUVM0NE56Z3VPRGM0TERBc01Dd3hMRE0zTVM0Mk16a3NNalkwTGpneU5Gb25JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0Mwek5EWXVNVGMxSUMweU5qTXVPVFEyS1NjZ1ptbHNiRDBuSlRJellXWmlPV1F5Snk4bE0wVWxNME53WVhSb0lHUTlKMDB6TXpZdU16STRMREkxTm1nd1lTNDROemd1T0RjNExEQXNNQ3d4TEM0NE56Z3VPRGM0ZGpRdU16bGhMamczT0M0NE56Z3NNQ3d3TERFdExqZzNPQzQ0Tnpob01HRXVPRGM0TGpnM09Dd3dMREFzTVMwdU9EYzRMUzQ0TnpoMkxUUXVNemxCTGpnM09DNDROemdzTUN3d0xERXNNek0yTGpNeU9Dd3lOVFphSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3RNekUwTGpNM05pQXRNalUxTGprNU5pa25JR1pwYkd3OUp5VXlNMkZtWWpsa01pY3ZKVE5GSlROREwyY2xNMFVsTTBObklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLREV5TXk0MU9ETWdNalV1TkRRMktTY2xNMFVsTTBOamFYSmpiR1VnWTNnOUp6QXVPRGsxSnlCamVUMG5NQzQ0T1RVbklISTlKekF1T0RrMUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d3SURBdU9EWXlLU2NnWm1sc2JEMG5KVEl6T1RVNVkySXpKeThsTTBVbE0wTmphWEpqYkdVZ1kzZzlKekF1T0RrMUp5QmplVDBuTUM0NE9UVW5JSEk5SnpBdU9EazFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNnekxqUTVOaWtuSUdacGJHdzlKeVV5TXprMU9XTmlNeWN2SlRORkpUTkRZMmx5WTJ4bElHTjRQU2N3TGpnNU5TY2dZM2s5SnpBdU9EazFKeUJ5UFNjd0xqZzVOU2NnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb01qUXVOVFV5SURBdU9EWXlLU2NnWm1sc2JEMG5KVEl6T1RVNVkySXpKeThsTTBVbE0wTmphWEpqYkdVZ1kzZzlKekF1T0RrMUp5QmplVDBuTUM0NE9UVW5JSEk5SnpBdU9EazFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNneU1TNHdOVGNwSnlCbWFXeHNQU2NsTWpNNU5UbGpZak1uTHlVelJTVXpReTluSlRORkpUTkRaeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNneE16VXVPRGMySURJekxqY3dOeWtuSlRORkpUTkRjR0YwYUNCa1BTZE5NalE0TGpBMUxESTBNeTQyTURob01HRXVPRGM0TGpnM09Dd3dMREFzTUN3dU9EYzRMUzQ0TnpoMkxUTXVOVEV5WVM0NE56Z3VPRGM0TERBc01Dd3dMUzQ0TnpndExqZzNPR2d3WVM0NE56Z3VPRGM0TERBc01Dd3dMUzQ0TnpndU9EYzRkak11TlRFeVFTNDROemd1T0RjNExEQXNNQ3d3TERJME9DNHdOU3d5TkRNdU5qQTRXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUSTBOeTR4TnpJZ0xUSXpPQzR6TkNrbklHWnBiR3c5SnlVeU0yTTNZMlpsTWljdkpUTkZKVE5EY0dGMGFDQmtQU2ROTWpjMExqVXpOQ3d5TkRNdU5qQTRhREJoTGpnM09DNDROemdzTUN3d0xEQXNMamczT0MwdU9EYzRkaTB6TGpVeE1tRXVPRGM0TGpnM09Dd3dMREFzTUMwdU9EYzRMUzQ0Tnpob01HRXVPRGM0TGpnM09Dd3dMREFzTUMwdU9EYzRMamczT0hZekxqVXhNa0V1T0RjNExqZzNPQ3d3TERBc01Dd3lOelF1TlRNMExESTBNeTQyTURoYUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d0TWpjeExqQXlNaUF0TWpNNExqTTBLU2NnWm1sc2JEMG5KVEl6WXpkalptVXlKeThsTTBVbE0wTXZaeVV6UlNVelEzQmhkR2dnWkQwblRUSXlNUzQxTmpjc01qUXpMall3T0dnd1lTNDROemd1T0RjNExEQXNNQ3d3TEM0NE56Z3RMamczT0hZdE15NDFNVEpoTGpnM09DNDROemdzTUN3d0xEQXRMamczT0MwdU9EYzRhREJoTGpnM09DNDROemdzTUN3d0xEQXRMamczT0M0NE56aDJNeTQxTVRKQkxqZzNPQzQ0Tnpnc01Dd3dMREFzTWpJeExqVTJOeXd5TkRNdU5qQTRXaWNnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb0xUZzNMalEwTnlBdE1qRTBMall6TXlrbklHWnBiR3c5SnlVeU0yRm1ZamxrTWljdkpUTkZKVE5ETDJjbE0wVWxNME12YzNabkpUTkZYQ0lwTzF4dVhIUmlZV05yWjNKdmRXNWtMWE5wZW1VNlkyOXVkR0ZwYmp0Y2JseDBZbUZqYTJkeWIzVnVaQzF5WlhCbFlYUTZibTh0Y21Wd1pXRjBPMXh1ZlZ4dVhHNHVZWE4wWlhKdmFXUXVZV04wYVhabElIdGNibHgwZDJsa2RHZzZOakJ3ZUR0Y2JseDBhR1ZwWjJoME9qWXdjSGc3WEc1Y2RHSmhZMnRuY205MWJtUXRhVzFoWjJVNklIVnliQ2hjSW1SaGRHRTZhVzFoWjJVdmMzWm5LM2h0YkN3bE0wTnpkbWNnZUcxc2JuTTlKMmgwZEhBNkx5OTNkM2N1ZHpNdWIzSm5Mekl3TURBdmMzWm5KeUIzYVdSMGFEMG5OalVuSUdobGFXZG9kRDBuTmpRbklIWnBaWGRDYjNnOUp6QWdNQ0EyTlNBMk5DY2xNMFVsTTBObklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLQzB4TURBeklDMDBPVEFwSnlVelJTVXpRMk5wY21Oc1pTQmplRDBuTWpNdU5TY2dZM2s5SnpJekxqVW5JSEk5SnpJekxqVW5JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0RFd01Ea2dOVEF5S1NjZ1ptbHNiRDBuSlRJelpESmxNMll4Snk4bE0wVWxNME5qYVhKamJHVWdZM2c5SnprbklHTjVQU2M1SnlCeVBTYzVKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNneE1EQTVJRFV3TWlrbklHWnBiR3c5SnlVeU0yUXlaVE5tTVNjdkpUTkZKVE5EWTJseVkyeGxJR040UFNjeE1pY2dZM2s5SnpFeUp5QnlQU2N4TWljZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9NVEF5TVNBME9UQXBKeUJtYVd4c1BTY2xNak5rTW1VelpqRW5MeVV6UlNVelEyTnBjbU5zWlNCamVEMG5NVEluSUdONVBTY3hNaWNnY2owbk1USW5JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0RFd016TWdORGs1S1NjZ1ptbHNiRDBuSlRJelpESmxNMll4Snk4bE0wVWxNME5qYVhKamJHVWdZM2c5SnpFeUp5QmplVDBuTVRJbklISTlKekV5SnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3hNREF6SURVeU1Da25JR1pwYkd3OUp5VXlNMlF5WlRObU1TY3ZKVE5GSlRORFkybHlZMnhsSUdONFBTY3hNaWNnWTNrOUp6RXlKeUJ5UFNjeE1pY2dkSEpoYm5ObWIzSnRQU2QwY21GdWMyeGhkR1VvTVRBek15QTFNekFwSnlCbWFXeHNQU2NsTWpOa01tVXpaakVuTHlVelJTVXpRMk5wY21Oc1pTQmplRDBuTnk0MUp5QmplVDBuTnk0MUp5QnlQU2MzTGpVbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLREV3TkRnZ05USXpLU2NnWm1sc2JEMG5KVEl6WkRKbE0yWXhKeThsTTBVbE0wTmphWEpqYkdVZ1kzZzlKemN1TlNjZ1kzazlKemN1TlNjZ2NqMG5OeTQxSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3hNREV3SURVeU15a25JR1pwYkd3OUp5VXlNelJoT0dSak5pY3ZKVE5GSlRORFkybHlZMnhsSUdONFBTYzNMalVuSUdONVBTYzNMalVuSUhJOUp6Y3VOU2NnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb01UQXhOU0ExTVRRcEp5Qm1hV3hzUFNjbE1qTTBZVGhrWXpZbkx5VXpSU1V6UTJOcGNtTnNaU0JqZUQwbk1UZ25JR041UFNjeE9DY2djajBuTVRnbklIUnlZVzV6Wm05eWJUMG5kSEpoYm5Oc1lYUmxLREV3TVRnZ05UQTBLU2NnWm1sc2JEMG5KVEl6TkdFNFpHTTJKeThsTTBVbE0wTmphWEpqYkdVZ1kzZzlKemN1TlNjZ1kzazlKemN1TlNjZ2NqMG5OeTQxSnlCMGNtRnVjMlp2Y20wOUozUnlZVzV6YkdGMFpTZ3hNREV3SURVeU15a25JR1pwYkd3OUp5VXlNelJoT0dSak5pY3ZKVE5GSlRORFkybHlZMnhsSUdONFBTYzBMalVuSUdONVBTYzBMalVuSUhJOUp6UXVOU2NnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb01UQTFPU0ExTVRNcEp5Qm1hV3hzUFNjbE1qTmtNbVV6WmpFbkx5VXpSU1V6UTJOcGNtTnNaU0JqZUQwbk55NDFKeUJqZVQwbk55NDFKeUJ5UFNjM0xqVW5JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0RFd016WWdOVE16S1NjZ1ptbHNiRDBuSlRJek5HRTRaR00ySnk4bE0wVWxNME5qYVhKamJHVWdZM2c5SnpjdU5TY2dZM2s5SnpjdU5TY2djajBuTnk0MUp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d4TURJM0lEUTVPU2tuSUdacGJHdzlKeVV5TXpSaE9HUmpOaWN2SlRORkpUTkRZMmx5WTJ4bElHTjRQU2MzTGpVbklHTjVQU2MzTGpVbklISTlKemN1TlNjZ2RISmhibk5tYjNKdFBTZDBjbUZ1YzJ4aGRHVW9NVEF5TUNBMU1UZ3BKeUJtYVd4c1BTY2xNak0zTjJGaFpEUW5MeVV6UlNVelEyTnBjbU5zWlNCamVEMG5OeTQxSnlCamVUMG5OeTQxSnlCeVBTYzNMalVuSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtERXdNek1nTlRBM0tTY2dabWxzYkQwbkpUSXpOemRoWVdRMEp5OGxNMFVsTTBOamFYSmpiR1VnWTNnOUp6VXVOU2NnWTNrOUp6VXVOU2NnY2owbk5TNDFKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNneE1ETTNJRFV5TnlrbklHWnBiR3c5SnlVeU16YzNZV0ZrTkNjdkpUTkZKVE5EWTJseVkyeGxJR040UFNjMEp5QmplVDBuTkNjZ2NqMG5OQ2NnZEhKaGJuTm1iM0p0UFNkMGNtRnVjMnhoZEdVb01UQXpOeUExTWpjcEp5Qm1hV3hzUFNjbE1qTm1abVluTHlVelJTVXpRMk5wY21Oc1pTQmplRDBuTkNjZ1kzazlKelFuSUhJOUp6UW5JSFJ5WVc1elptOXliVDBuZEhKaGJuTnNZWFJsS0RFd01qWWdOVEl3S1NjZ1ptbHNiRDBuSlRJelptWm1KeThsTTBVbE0wTmphWEpqYkdVZ1kzZzlKelFuSUdONVBTYzBKeUJ5UFNjMEp5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d4TURRd0lEVXhNU2tuSUdacGJHdzlKeVV5TTJabVppY3ZKVE5GSlROREwyY2xNMFVsTTBNdmMzWm5KVE5GWENJcE8xeHVYSFJpWVdOclozSnZkVzVrTFhOcGVtVTZZMjl1ZEdGcGJqdGNibHgwWW1GamEyZHliM1Z1WkMxeVpYQmxZWFE2Ym04dGNtVndaV0YwTzF4dWZWeHVJbDE5ICovPC9zdHlsZT5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFtSFEsS0FBSyxBQUFDLENBQUMsS0FBSyxJQUFJLEFBQUMsQ0FBQyxBQUUxQixLQUFLLGVBQUMsQ0FBQyxBQUNOLE9BQU8sSUFBSSxDQUNYLGdCQUFnQixLQUFLLENBQ3JCLGtCQUFrQixTQUFTLENBQzNCLGlCQUFpQixJQUFJLG9oZEFBb2hkLENBQUMsQ0FDMWlkLE1BQU0sQ0FBRSxJQUFJLHNoRUFBc2hFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxBQUNoakUsQ0FBQyxBQUNELElBQUksZUFBQyxDQUFDLEFBQ0wsU0FBUyxRQUFRLENBQ2pCLFFBQVEsQ0FBQyxDQUNULFVBQVUsQ0FBRSxPQUFPLENBQUMsSUFBSSxBQUN6QixDQUFDLEFBRUQsSUFBSSxPQUFPLGVBQUMsQ0FBQyxBQUNaLFFBQVEsQ0FBQyxBQUNWLENBQUMsQUFFRCxTQUFTLGVBQUMsQ0FBQyxBQUNWLE1BQU0sSUFBSSxDQUNWLE9BQU8sSUFBSSxDQUNYLGdCQUFnQixDQUFFLElBQUksK2xGQUErbEYsQ0FBQyxDQUN0bkYsZ0JBQWdCLE9BQU8sQ0FDdkIsa0JBQWtCLFNBQVMsQUFDNUIsQ0FBQyxBQUNELFVBQVUsZUFBQyxDQUFDLEFBQ1gsTUFBTSxJQUFJLENBQ1YsT0FBTyxJQUFJLENBQ1gsZ0JBQWdCLENBQUUsSUFBSSw4eUpBQTh5SixDQUFDLENBQ3IwSixnQkFBZ0IsT0FBTyxDQUN2QixrQkFBa0IsU0FBUyxBQUM1QixDQUFDLEFBRUQsU0FBUyxPQUFPLGVBQUMsQ0FBQyxBQUNqQixNQUFNLElBQUksQ0FDVixPQUFPLElBQUksQ0FDWCxnQkFBZ0IsQ0FBRSxJQUFJLDAxREFBMDFELENBQUMsQ0FDajNELGdCQUFnQixPQUFPLENBQ3ZCLGtCQUFrQixTQUFTLEFBQzVCLENBQUMifQ== */";
    	append(document.head, style);
    }

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
    			div.className = "gfx svelte-14hrccn";
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
    	var div, t, svg, g1, path0, path1, path2, path3, path4, path5, path6, path7, g0, circle0, circle1, circle2, circle3, path8, path9, dispose;

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

    			t = space();
    			svg = svg_element("svg");
    			g1 = svg_element("g");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			g0 = svg_element("g");
    			circle0 = svg_element("circle");
    			circle1 = svg_element("circle");
    			circle2 = svg_element("circle");
    			circle3 = svg_element("circle");
    			path8 = svg_element("path");
    			path9 = svg_element("path");
    			div.id = "JSE-game";
    			div.className = "game svelte-14hrccn";
    			add_location(div, file, 3, 0, 81);
    			attr(path0, "d", "M230.994,11.742,221.867,22.4v2A14.671,14.671,0,0,0,236.3,12.366,25.741,25.741,0,0,0,230.994,11.742Z");
    			attr(path0, "transform", "translate(-195.867 -10.366)");
    			attr(path0, "fill", "#4a8dc6");
    			add_location(path0, file, 8, 113, 638);
    			attr(path1, "d", "M146.179,11.984l.035-.268a31.976,31.976,0,0,0-20.381,7.4,14.635,14.635,0,0,0,11.254,5.262v-2C141.56,22.375,145.383,18,146.179,11.984Z");
    			attr(path1, "transform", "translate(-111.088 -10.34)");
    			attr(path1, "fill", "#77aad4");
    			add_location(path1, file, 8, 279, 804);
    			attr(path2, "d", "M241.059,24.221A10.663,10.663,0,0,0,233.9,7.441a22.167,22.167,0,0,0-8.472-4.913c.011-.057.022-.114.033-.171a2,2,0,0,0-3.936-.713,12.621,12.621,0,0,1-1.353,3.82l-12.81,51.886a10.663,10.663,0,0,0,17.178-4.719,35.188,35.188,0,0,0,4.576-3.339,4.666,4.666,0,0,0,5.2-5.506A31.8,31.8,0,0,0,241.059,24.221Z");
    			attr(path2, "transform", "translate(-183.064 0)");
    			attr(path2, "fill", "#a5c6e3");
    			add_location(path2, file, 8, 478, 1003);
    			attr(path3, "d", "M53.914,67.8c.528-6.259-1.372-11.9-5.351-15.875A18.917,18.917,0,0,0,37.11,46.619a12.672,12.672,0,0,1-20.83,2.026,2,2,0,1,0-3.068,2.567l.016.019q-.657.6-1.293,1.229a35.744,35.744,0,0,0-4.177,5.017A12.672,12.672,0,0,0,2.013,76.009,23.1,23.1,0,0,0,8.608,91.916,23.064,23.064,0,0,0,24.3,98.505a51.738,51.738,0,0,0,20.936-12.78A29.072,29.072,0,0,0,53.914,67.8Z");
    			attr(path3, "transform", "translate(0 -41.156)");
    			attr(path3, "fill", "#d2e3f1");
    			add_location(path3, file, 8, 837, 1362);
    			attr(path4, "d", "M267.378,364.089v13.333a6.667,6.667,0,0,0,0-13.333Z");
    			attr(path4, "transform", "translate(-236.045 -321.423)");
    			attr(path4, "fill", "#4a8dc6");
    			add_location(path4, file, 8, 1252, 1777);
    			attr(path5, "d", "M219.821,370.756c0-3.682-1.194-6.667-2.667-6.667a6.667,6.667,0,0,0,0,13.333C218.628,377.422,219.821,374.438,219.821,370.756Z");
    			attr(path5, "transform", "translate(-185.821 -321.423)");
    			attr(path5, "fill", "#77aad4");
    			add_location(path5, file, 8, 1371, 1896);
    			attr(path6, "d", "M420.978,96.711v13.333a6.667,6.667,0,0,0,0-13.333Z");
    			attr(path6, "transform", "translate(-371.645 -85.378)");
    			attr(path6, "fill", "#4a8dc6");
    			add_location(path6, file, 8, 1563, 2088);
    			attr(path7, "d", "M373.421,103.378c0-3.682-1.194-6.667-2.667-6.667a6.667,6.667,0,1,0,0,13.333C372.228,110.044,373.421,107.06,373.421,103.378Z");
    			attr(path7, "transform", "translate(-321.421 -85.378)");
    			attr(path7, "fill", "#77aad4");
    			add_location(path7, file, 8, 1680, 2205);
    			attr(circle0, "cx", "1");
    			attr(circle0, "cy", "1");
    			attr(circle0, "r", "1");
    			attr(circle0, "transform", "translate(13.333 4)");
    			attr(circle0, "fill", "#a5c6e3");
    			add_location(circle0, file, 8, 1906, 2431);
    			attr(circle1, "cx", "1");
    			attr(circle1, "cy", "1");
    			attr(circle1, "r", "1");
    			attr(circle1, "transform", "translate(17.333)");
    			attr(circle1, "fill", "#a5c6e3");
    			add_location(circle1, file, 8, 1982, 2507);
    			attr(circle2, "cx", "1");
    			attr(circle2, "cy", "1");
    			attr(circle2, "r", "1");
    			attr(circle2, "transform", "translate(28 12.667)");
    			attr(circle2, "fill", "#a5c6e3");
    			add_location(circle2, file, 8, 2056, 2581);
    			attr(circle3, "cx", "1");
    			attr(circle3, "cy", "1");
    			attr(circle3, "r", "1");
    			attr(circle3, "transform", "translate(0 24.667)");
    			attr(circle3, "fill", "#a5c6e3");
    			add_location(circle3, file, 8, 2133, 2658);
    			attr(g0, "transform", "translate(15.667 25)");
    			add_location(g0, file, 8, 1870, 2395);
    			attr(path8, "d", "M108.089,164.978v17.333a8.667,8.667,0,1,0,0-17.333Z");
    			attr(path8, "transform", "translate(-95.422 -145.645)");
    			attr(path8, "fill", "#4a8dc6");
    			add_location(path8, file, 8, 2213, 2738);
    			attr(path9, "d", "M47.466,173.644c0-4.786-2.089-8.667-4.667-8.667a8.667,8.667,0,1,0,0,17.333C45.377,182.31,47.466,178.43,47.466,173.644Z");
    			attr(path9, "transform", "translate(-30.133 -145.644)");
    			attr(path9, "fill", "#77aad4");
    			add_location(path9, file, 8, 2331, 2856);
    			attr(g1, "transform", "translate(0 0)");
    			add_location(g1, file, 8, 83, 608);
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "width", "60");
    			attr(svg, "height", "60");
    			attr(svg, "viewBox", "0 0 60 60");
    			add_location(svg, file, 8, 0, 525);

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

    			insert(target, t, anchor);
    			insert(target, svg, anchor);
    			append(svg, g1);
    			append(g1, path0);
    			append(g1, path1);
    			append(g1, path2);
    			append(g1, path3);
    			append(g1, path4);
    			append(g1, path5);
    			append(g1, path6);
    			append(g1, path7);
    			append(g1, g0);
    			append(g0, circle0);
    			append(g0, circle1);
    			append(g0, circle2);
    			append(g0, circle3);
    			append(g1, path8);
    			append(g1, path9);
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

    			if (detaching) {
    				detach(t);
    				detach(svg);
    			}

    			run_all(dispose);
    		}
    	};
    }

    const spaceShipIco = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAA8CAYAAADsWQMXAAAAHHRFWHRTb2Z0d2FyZQBBZG9iZSBGaXJld29ya3MgQ1M26LyyjAAAC49JREFUaN7NmXuQlfV5xz/P733Pfc/eYBfYclmQOIpVMQgqCgh4qbfpgIJWFJym4zgSxWCTOJ1JJpNaazN2JmmTdEpbm6qxSTUGx0s0GhAhKIpBLgkiF12WhQWWZXfP7rm8l9/TP87Zs7vhLKZx0Z6ZM2fm/Z3f837f7/N9br9XVJX/Lx8zUoa+tnTRuL9ddOOET2PDHSkw5x1oW9Xl+2OBuz5XZl696foJqVzhflsIlj88e96FnysYe+TEg25oE6oqiZ7M33xuYJ76s/nN5P2/EgSjigmDmx+bu2D65wKmqjN7rxOEKQUUARs60tX1lc8czOO33TTKzQd3SH92EBBrEN9f/J25c6Z8pmDqPj6+2AmCcRgpXlBQoxjVKjfn3/XZgREI27y7/c4Qr8tS6IZcj5DvNuS6IHcov0zk1uj/yeQfm4H1o2vmHd9xbL3RQEQcfJujo+8IQpEli8uo5ro7mq7Y/+MznvRe/njs0sSklIgA4hAEGbpOeAiCCKgVsu0NS5bDj88oM3d+67HUtkPhrkzBNAuCOA5eNsvRln2ICIigKFVx7ZrSGJn2m5+uOXLGmPn4JFeIoTmVsMUncsC1IalUWAZTlJXWHs0E1wP/ccYEnM2HN9vizcpfI8VfBl1TVWyoi89YNF2/6rFYAHPQ4o3Lgq4kchFC1Vlzbl857oyA6fG96ap6tgqImjKSUA2BmpKLym4iUB3d2lOYdUbA+MbMCcGICmKUvoJLps8lagJiTkBPr0Mm5yJShKSqFHx/3hkRsBfKXFVFDHT2xpg2rpN7r93JReP30921l/dbRvG9F2ewbe9Y6qo9rFV8ZO6IM7Ps64+mrLVfFAO9WZeLJh7n2b9+kUWzoSNyK721X2bJgnpe+/YLzDv/ECd7XUQUUc6Ztez+ySMKZm+fXhgqY60VopGAR5Zuxo2fx/0bV7Fk0wWseHcBD237F/zYVTz2pTeoSxUIrEOopI715meOKBgbyoWAky04TGs6wQWTMvxkz7U82XqMbj1GZ3iYpw618/OWFfzpRMvMqUfJ5hxA8b3gghEWsJwPECrUxT1wo+zLRCngkTQOCSeCpwUO9MVxTA31VTmsBVUIrZ47gmCeIlSmoELUhUNdVQSFPJeMPkpaaukOQjJ+SK07ii/WtJDzOth/tAY3UsxAgerk+beuio9INN349ba0os0qSiIS8kF7Hc9vncjN85+hLXs3PznYhDHCLU1HuOWs7/HshnFsO9BIKhEWE6JK80e9+Vqg/VOD6cmZGqthkyIIlngk5JvPXcqo6vWsnPFd7jp7In35Fupju1n/XjWr1ywkYgyGIhgVrXPjduyIgBG1DaikRRVEiEctuYLLl9Ys5Ibph7l40m46O7rYsm8Gz285i8A6VCV81JaStCoaygTg/U8Nxrd2jBUpFyGrkIgFhKFh7bbJ/PemcXS0TgAjVCUD4tEAtaZctVQhDHTsiAg4CGxdkZVy14mqYIwWy1HRF4iAa4prg8unFHXTMCICVmMaNRAQhVJzaVXI5CJcOa2F687dxcnO3/Hytqm88puppBIWV2wZjgUCtWNGhBkRiSMgKqVCLXRlI9wzfztP3reD2ZdczLwFV/PsN/bw0JItZPpcbKnD6a/giLojwkw+0IgiZTf1FRzOG3ecr/15C0/vu4dHf1tHYA33TL2Kh5as5lfvt7J133jSCb/c76iqGakMLEMEHTjMbG7HN2ex5sNaPsy30OId4PED4zjBTK44p5UwMAObRAgtkREBk3fcvAxxm3IyFydmMjTGBGtjhJqkMSakzAlO9sbKvXB/B2Yd0/sHuWntrLkLTT6z1EYT73ip9C+Xbni1tX/tvYULRk+ccNmktmi6jD4VC9jwwQQOHN7NI5etI731cjwbsuq8p+k4upuX3ruOeMwfiCeFer8w/om588cuf3N9OfH9w5yrmiI9XdeYwM4RVeW5BTc2xI+3v+143hRrBOu6naHrbkCkw2DH1mX7zl87+aLmZybPoMrPo1IM4UwuwlkNXXxn2dtMawrJ9B3gw4PdrPq32exoaaI6VUBtkZ1ex+HK7iPc1nXwcCYS34WYNqOatqE/F2sbUS0y4xV6royHQVM/ra7v15sgWNSfrdT3cWwIUjppQFErpBMeH3XUcsf3r2XqqI/oaHfZ1TqGvB+jOulhtRRFGASDg8UGtglbaELAFhNEyaIUwbhqzkbFVSndSqQsPC3NQU4YDCS7UlSpCsmYD+KyvbWJ9oNZEnGlOuFTzI8DjTmqRK1FRAeFgvavDghY1YaIKsMMl4qQCP3iX+TUPxlRquI+6USAIxYrlWMxVhpv9HTRpI6zR1DvdEqPB37pGeSUeM95Lsd6opzsjtDrRSqGqKLEbFhy82miKUpkv2D6EJuqlFysQCL0cbTIUj+xRqA7F+ULjSd4YOF2ujp288zmL7CrdTw1KZ/+OV4BR4W4hgxLi5bA9KbjHdFuc8L4trEScMWQCDxc66OYUmqH3rzLBU1H+NHKPbTL5YThNFbc8DOWPeLz1p6JpJMhqv1gLIkwwA7SY0U3ZWdOO65Ghj0pUBGSfoGI2qKgS5XP85V7r97LB97VLHr9Iv5iw/Uc0Pt4cNE+VJVQByTsoKSsX1lPxYapCObubz/qi5jW4cCEIiQCj0TgEYqUq7BrLA1VsPNkPfuznezPHeF3XU00VDu4ToC1RYdaEaIakrRhKZArYZEBrakxHwxXxlSEeOBT7RXKWcERIbARXt5Rx21TNvDgOUkeODvF4klP8sI7CQpejIhTbPNChGQYkDiNgFUGlQPflZ0xhg/taBiQ9vLY0mCvKNWpgP/69bk0pHfwwMx/p6d3H48/a/mnly4hnQpLAhasQNL2gxm2RxkA05eu3hrtzWeM2rTKqcy41jKqkEFlgD5HLDFXePTli/nXX7ZxrM2hvWcU6USIa2yZBYtQFxSIaEhenMqPK44tW172q1ePquPsrJSStHjeRkM2w2CgChijVCd9ur1qTubqqEn6OI4dYkWB+sDDWK3oJlGwRlqGqMTGohuGlv1Bawhj+rqJ2uBUgwIxxxJ3gwEBDPo4KGO8LFrhWKm/vKg4bwwFE4mstyJ6ymOp4jsu9dbb7ELPcOyd0oH1syfka1y2hkYqrmMM1nVfGwKmr6Z+kxqnhd9Do0A2nf7BnW+vu8LVYF+ltCUVjtP6c0xMtXPzD56YHSZSD6tUsO6Yzujoxg1DwNz+ys9zNhJ5ZSjLQhCLvnnne2/dB2hMdM+AudMf2/a7M4Ldu2VWs//l7Vu/YSPRl2TQXlHAOBvvf/2Fw6dklqA+9Z/qOCqlumKN2EI6+dWu0u6IOJuNDpT/07tJESyOkU3lS7W1X1XHeP0b1AjWja2p2ANHl69+1xrnNS01VjYaeeWWTW++U14n2GJEg8H9pJQ4kEGAZGDEwRHZ3P/v1RvX7caJ/k9pCkQdd2dPXfy1imBuWHGD+lVV37VO8eRSY8nnB6+PdbK/FaFdMfS6MTKRJD2RBJlIjIwTIeNE6HFcek0Ei+IYkx1fl9g+dCB01hZPIA0SS/zjt9at84edmxZtfuMXL0y/9Bd4+et8dxDFwE//+eHsZff+/SpcZsxv3XlfxCukxTjkvAJt3SfLrFjjZHfXjfuhH3N3vfX0D9uGvhuq3kJ7VnHcbfF5f/fEJ747eO7yBVOdXO9TXn3jtUtef7H71Ne1ydqNQfMB4wd1RgxZlP1GKHeVRnIXR+2F03ft2fv7W984uNG8f9PqbRqNrfzKu5s2feLctPjX6/admDjp1mwynq20/rPamZdk3FhNTyxJJpqgJxKjV1wyTulr3MQ6p+bSSntbvvkkweimWwYD+cTx9i/XPtMy3Foil/8TR9UIYFBcBFeKBa+/E3SMM7HS3hU/WmOBvSPyIuP70y+Vbj+8JhsG9IUB2TAgowFd1tIVhnSHxd/jQf7qlbcvT/6hdv8XkBFxo3e45gcAAAAASUVORK5CYII=';

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
    		if (!document.getElementById("svelte-14hrccn-style")) add_css();
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    /* src\components\JSECaptcha.svelte generated by Svelte v3.5.1 */

    const file$1 = "src\\components\\JSECaptcha.svelte";

    function add_css$1() {
    	var style = element("style");
    	style.id = 'svelte-lngsnr-style';
    	style.textContent = "#JSE-Captcha.flat.svelte-lngsnr{background:none;padding:0px}#JSE-Captcha.flat.svelte-lngsnr details.svelte-lngsnr{box-shadow:0px 0px 0px 4px rgba(0, 0, 0, 0.06)}#JSE-Captcha.S.svelte-lngsnr{border-radius:6px;padding:8px;margin:5px;font-size:11px}#JSE-Captcha.S.svelte-lngsnr #JSE-input.svelte-lngsnr{height:20px;min-width:20px;font-size:15px;border:solid 1px #D3D8DD;padding:2px;margin:6px}#JSE-Captcha.S.svelte-lngsnr #JSE-brand.svelte-lngsnr{width:30px;border-left:solid 2px #F9F9F9}#JSE-Captcha.S.svelte-lngsnr #JSE-brand svg.svelte-lngsnr{width:24px}#JSE-Captcha.S.flat.svelte-lngsnr details.svelte-lngsnr{box-shadow:0px 0px 0px 2px rgba(0, 0, 0, 0.06)}#JSE-Captcha.M.svelte-lngsnr{border-radius:6px;padding:8px;margin:5px;font-size:16px}#JSE-Captcha.M.svelte-lngsnr #JSE-input.svelte-lngsnr{height:30px;min-width:30px;font-size:22px;border:solid 2px #D3D8DD;margin:8px}#JSE-Captcha.M.svelte-lngsnr #JSE-brand.svelte-lngsnr{width:38px;border-left:solid 2px #F9F9F9}#JSE-Captcha.M.svelte-lngsnr #JSE-brand svg.svelte-lngsnr{width:34px;margin-top:4px}#JSE-Captcha.M.flat.svelte-lngsnr details.svelte-lngsnr{box-shadow:0px 0px 0px 2px rgba(0, 0, 0, 0.06)}#JSE-Captcha.L.svelte-lngsnr{}#JSE-Captcha.L input#captchaCheck{width:30px;height:30px;margin:10px}#JSE-Captcha.svelte-lngsnr{display:none;background:#F2F8FF;border-radius:6px;clear:both;padding:13px;margin:10px;min-width:200px;max-width:314px;color:#707070;font-size:20px;font-family:'Montserrat', sans-serif}#JSE-Captcha.svelte-lngsnr .svelte-lngsnr{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}#JSE-Captcha.svelte-lngsnr details.svelte-lngsnr{overflow:hidden;margin:0px;background:#fff;border-radius:4px;box-shadow:0px 3px 6px 0px rgba(0, 0, 0, 0.12)}#JSE-Captcha.svelte-lngsnr details summary.svelte-lngsnr{display:flex;outline:none}#JSE-Captcha.svelte-lngsnr details #JSE-CaptchaDisplay.svelte-lngsnr{opacity:0;margin:0px;padding:0px;height:0px;transition:opacity 0.2s, height 0.4s;background:#fff}#JSE-Captcha.svelte-lngsnr details.captchaPanel[open] #JSE-CaptchaDisplay.svelte-lngsnr{-webkit-animation-name:svelte-lngsnr-slideDown;animation-name:svelte-lngsnr-slideDown;-webkit-animation-duration:0.3s;animation-duration:0.3s;-webkit-animation-fill-mode:forwards;animation-fill-mode:forwards;-webkit-animation-delay:0.3s;animation-delay:0.3s}#JSE-Captcha.svelte-lngsnr #JSE-input.svelte-lngsnr{border:solid 4px #D3D8DD;border-radius:4px;margin:10px;min-width:40px;height:40px;cursor:pointer;font-size:28px;text-align:center;position:relative;overflow:hidden}#JSE-Captcha.svelte-lngsnr details>summary.svelte-lngsnr::-webkit-details-marker{display:none}#JSE-Captcha.svelte-lngsnr details #JSE-input.svelte-lngsnr:hover:before{content:'🤖';opacity:1}#JSE-Captcha.success.svelte-lngsnr details #JSE-input.svelte-lngsnr:before{content:'😉';opacity:1}#JSE-Captcha.success.svelte-lngsnr details #JSE-input.svelte-lngsnr:after{content:'✔';opacity:1;color:#26AE60;padding:0px 4px 0px 5px;border-left:solid 2px #D3D8DD}#JSE-Captcha.success.svelte-lngsnr details.captchaPanel[open] #JSE-input.svelte-lngsnr:after{content:'';opacity:0;padding:0px;border:0px}#JSE-Captcha.svelte-lngsnr details #JSE-input.svelte-lngsnr:before,#JSE-Captcha.svelte-lngsnr details.captchaPanel[open] #JSE-input.svelte-lngsnr:before{opacity:0;content:'🤖';transition:opacity 0.2s;position:absolute;top:0px;left:0px;bottom:0px;right:0px;background:#fff}#JSE-Captcha.success.svelte-lngsnr details.captchaPanel #JSE-input.svelte-lngsnr:before{right:50%}#JSE-Captcha.success.svelte-lngsnr details.captchaPanel[open] #JSE-input.svelte-lngsnr:after{display:none}#JSE-Captcha.success.svelte-lngsnr details.captchaPanel #JSE-input.svelte-lngsnr:after{left:50%;position:absolute;top:0px;bottom:0px;right:0px;background:#fff}#JSE-Captcha.success.svelte-lngsnr #JSE-input.svelte-lngsnr{min-width:52px}#JSE-Captcha.success.svelte-lngsnr details.captchaPanel[open] #JSE-input.svelte-lngsnr{min-width:20px}#JSE-Captcha.svelte-lngsnr details.captchaPanel[open] #JSE-input.svelte-lngsnr:before{opacity:1}#JSE-Captcha.svelte-lngsnr #JSE-msg.svelte-lngsnr{align-self:center;padding:0px 0px 0px 4px;flex:1}#JSE-Captcha.svelte-lngsnr #JSE-msg p.svelte-lngsnr{vertical-align:bottom;display:inline-block;margin:0px;line-height:1.2}#JSE-Captcha.svelte-lngsnr #JSE-brand.svelte-lngsnr{border-left:solid 3px #F9F9F9;align-self:center;width:60px;padding:0px 4px;text-align:center}#JSE-Captcha.svelte-lngsnr #JSE-brand svg.svelte-lngsnr{fill:#51BFEC;width:48px}#JSE-Captcha.svelte-lngsnr #JSE-CaptchaDisplay #JSE-captcha-game-container.svelte-lngsnr{background:#F2F8FF;border-radius:6px;height:100%;position:relative;overflow:hidden}#JSE-Captcha.svelte-lngsnr #JSE-CaptchaDisplay #JSE-captcha-game.svelte-lngsnr{height:100%}@-webkit-keyframes svelte-lngsnr-slideDown{from{opacity:0;height:0;padding:8px;border-top:solid 4px #F9F9F9}to{opacity:1;height:190px;padding:8px;border-top:solid 4px #F9F9F9}}@keyframes svelte-lngsnr-slideDown{from{opacity:0;height:0;padding:8px;border-top:solid 4px #F9F9F9}to{opacity:1;height:190px;padding:8px;border-top:solid 4px #F9F9F9}}#JSE-Captcha.svelte-lngsnr details #JSE-msg>p.svelte-lngsnr:after{content:'Im human'}#JSE-Captcha.svelte-lngsnr details.captchaPanel[open] #JSE-msg>p.svelte-lngsnr:after,#JSE-Captcha.success.svelte-lngsnr details.captchaPanel[open] #JSE-msg>p.svelte-lngsnr:after{content:'Im not a robot'}#JSE-Captcha.success.svelte-lngsnr details #JSE-msg>p.svelte-lngsnr:after{content:'Verified human'}#JSE-input.svelte-lngsnr input[type=\"checkbox\"].svelte-lngsnr{}#JSE-Captcha.active.svelte-lngsnr{display:block}.gfx.svelte-lngsnr{position:absolute;opacity:1;transition:opacity 0.6s}.gfx.active.svelte-lngsnr{opacity:0}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSlNFQ2FwdGNoYS5zdmVsdGUiLCJzb3VyY2VzIjpbIkpTRUNhcHRjaGEuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjwhLS0gRE9NIFRhZyBOYW1lLS0+XG48c3ZlbHRlOm9wdGlvbnMgdGFnPVwianNlLWNhcHRjaGFcIi8+XG48IS0tIHhET00gVGFnIE5hbWUtLT5cblxuPCEtLSBKU0UgQ2FwdGNoYSAtLT5cbjwhLS0gXG5cdE9wdGlvbmFsIGNsYXNzZXNcblx0ZmxhdDogc3dhcHMgdG8gZmxhdCBkZXNpZ25cblx0UzogU21hbGwgY2FwdGNoYVxuXHRNOiBNZWNpdW0gY2FwdGNoYVxuXHRzdWNjZXNzOiBkaXNwbGF5cyBzdWNjZXNzIHBhbmVsIGNhcHRjaGEgbXVzdCBiZSBtaW5pbWlzZWRcbi0tPlxuXG48c2VjdGlvbiBpZD1cIkpTRS1DYXB0Y2hhXCIgY2xhc3M9XCJ7dGhlbWV9IHtzaXplfVwiIGNsYXNzOmFjdGl2ZT1cIntzaG93Q2FwdGNoYX1cIiBjbGFzczpzdWNjZXNzPVwie2NvbXBsZXRlfVwiPlxuXHQ8ZGV0YWlscyBjbGFzcz1cImNhcHRjaGFQYW5lbFwiIGJpbmQ6b3BlbiBvcGVuPlxuXHRcdDwhLS0gQ2FwdGNoYSBQYW5lbCAtLT5cblx0XHQ8c3VtbWFyeT5cblx0XHRcdDwhLS0gSW5wdXQgc2VsZWN0IGZpZWxkIC0tPlxuXHRcdFx0PGRpdiBpZD1cIkpTRS1pbnB1dFwiPlxuXHRcdFx0XHQ8aW5wdXQgaWQ9XCJjYXB0Y2hhQ2hlY2tcIiB0eXBlPVwiY2hlY2tib3hcIiBiaW5kOmNoZWNrZWQ9e2NhcHRjaGFDaGVja30gLz5cblx0XHRcdDwvZGl2PlxuXHRcdFx0PCEtLSB4SW5wdXQgc2VsZWN0IGZpZWxkIC0tPlxuXHRcdFx0XG5cdFx0XHQ8IS0tIEluZm8gbXNnIC0tPlxuXHRcdFx0PGRpdiBpZD1cIkpTRS1tc2dcIj5cblx0XHRcdFx0PHA+PC9wPlxuXHRcdFx0PC9kaXY+XG5cdFx0XHQ8IS0tIHhJbmZvIG1zZyAtLT5cblxuXHRcdFx0PCEtLSBKU0UgbG9nbyAtLT5cblx0XHRcdDxkaXYgaWQ9XCJKU0UtYnJhbmRcIj5cblx0XHRcdFx0PHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM6eGxpbms9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIgaWQ9XCJMYXllcl8xXCJcblx0XHRcdFx0XHR4PVwiMHB4XCIgeT1cIjBweFwiIHZpZXdCb3g9XCIwIDAgMTAwMCAxMDAwXCIgc3R5bGU9XCJ3aGl0ZS1zcGFjZTogcHJlc2VydmUtc3BhY2VzO1wiPlxuXHRcdFx0XHRcdDxnIGZpbHRlcj1cIm5vbmVcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoNDk4LDUwNykgdHJhbnNsYXRlKC00NDUuNTAzLC01MDAuOTk2KVwiXG5cdFx0XHRcdFx0XHRzdHlsZT1cImFuaW1hdGlvbjogYTBfdCAzLjZzIGxpbmVhciBpbmZpbml0ZSBib3RoO1wiPlxuXHRcdFx0XHRcdFx0PHBhdGhcblx0XHRcdFx0XHRcdFx0ZD1cIk01Ni4zLDU1Nkw1NS44LDcwNC4zQzU1LjksNzM1LjUsNzIuNyw3NjQuNSw5OS42LDc4MC4yTDIyOS4zLDg1NC41QzI1Niw4NjkuNywyODksODY5LjgsMzE2LjEsODU0LjdMNDQ2LjcsNzc5LjNDNDczLjYsNzYzLjgsNDkwLjUsNzM0LjksNDkwLjQsNzAzLjhMNDkwLjksNTU1LjVDNDkwLjgsNTI0LjMsNDc0LDQ5NS4zLDQ0Ny4xLDQ3OS42TDMxNy40LDQwNS4zQzI5MC43LDM5MC4xLDI1Ny43LDM5MCwyMzAuNiw0MDUuMUwxMDAsNDgwLjRDNzMuMSw0OTUuOSw1Ni4yLDUyNC44LDU2LjMsNTU2Wk0yNzMuMyw0NzBMNDExLjksNTUwLjhMNDExLjgsNzA5LjlMMjczLjksNzg5LjVMMTM2LDcxMEwxMzUuMyw1NDkuNkwyNzMuMyw0NzBaXCJcblx0XHRcdFx0XHRcdFx0dHJhbnNmb3JtPVwidHJhbnNsYXRlKC01NS44LC0wLjAzNzIyMTUpXCJcblx0XHRcdFx0XHRcdFx0c3R5bGU9XCJhbmltYXRpb246IGExX3QgMy42cyBsaW5lYXIgaW5maW5pdGUgYm90aDtcIiAvPlxuXHRcdFx0XHRcdFx0PHBhdGhcblx0XHRcdFx0XHRcdFx0ZD1cIk01MTAuMiw1NTYuM0w1MDkuNyw3MDQuNkM1MDkuOCw3MzUuOCw1MjYuNiw3NjQuOCw1NTMuNSw3ODAuNUw2ODMuMiw4NTQuOEM3MDkuOSw4NzAsNzQyLjksODcwLjEsNzcwLDg1NUw5MDAuNiw3NzkuNkM5MjcuNSw3NjQuMSw5NDQuNCw3MzUuMiw5NDQuMyw3MDQuMUw5NDQuOCw1NTUuOEM5NDQuNyw1MjQuNiw5MjcuOSw0OTUuNiw5MDEsNDc5LjlMNzcxLjMsNDA1LjZDNzQ0LjYsMzkwLjQsNzExLjYsMzkwLjMsNjg0LjUsNDA1LjRMNTUzLjksNDgwLjhDNTI3LjEsNDk2LjMsNTEwLjIsNTI1LjEsNTEwLjIsNTU2LjNaTTcyNy4yLDQ3MC40TDg2NS44LDU1MS4yTDg2NS43LDcxMC4zTDcyNy44LDc4OS45TDU5MCw3MTAuNEw1ODkuMyw1NTBMNzI3LjIsNDcwLjRaXCJcblx0XHRcdFx0XHRcdFx0dHJhbnNmb3JtPVwidHJhbnNsYXRlKC01NS44LC0wLjAzNzIyMTUpXCJcblx0XHRcdFx0XHRcdFx0c3R5bGU9XCJhbmltYXRpb246IGEyX3QgMy42cyBsaW5lYXIgaW5maW5pdGUgYm90aDtcIiAvPlxuXHRcdFx0XHRcdFx0PHBhdGhcblx0XHRcdFx0XHRcdFx0ZD1cIk0yODMsMTYyLjJMMjgyLjUsMzEwLjVDMjgyLjYsMzQxLjcsMjk5LjQsMzcwLjcsMzI2LjMsMzg2LjRMNDU2LDQ2MC43QzQ4Mi43LDQ3NS45LDUxNS43LDQ3Niw1NDIuOCw0NjAuOUw2NzMuNCwzODUuNUM3MDAuMywzNzAsNzE3LjIsMzQxLjEsNzE3LjEsMzEwTDcxNy42LDE2MS43QzcxNy41LDEzMC41LDcwMC43LDEwMS41LDY3My44LDg1LjhMNTQ0LjEsMTEuNUM1MTcuNCwtMy43LDQ4NC40LC0zLjgsNDU3LjMsMTEuM0wzMjYuNyw4Ni43QzI5OS44LDEwMi4yLDI4Mi45LDEzMSwyODMsMTYyLjJaTTQ5OS45LDc2LjNMNjM4LjUsMTU3TDYzOC40LDMxNi4xTDUwMC41LDM5NS43TDM2Mi43LDMxNi4yTDM2MiwxNTUuOUw0OTkuOSw3Ni4zWlwiXG5cdFx0XHRcdFx0XHRcdHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgtNTUuOCwtMC4wMzcyMjE1KVwiXG5cdFx0XHRcdFx0XHRcdHN0eWxlPVwiYW5pbWF0aW9uOiBhM190IDMuNnMgbGluZWFyIGluZmluaXRlIGJvdGg7XCIgLz5cblx0XHRcdFx0XHRcdDxnIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgtNTUuOCwtMC4wMzcyMjE1KVwiPlxuXHRcdFx0XHRcdFx0XHQ8Zz5cblx0XHRcdFx0XHRcdFx0XHQ8cGF0aFxuXHRcdFx0XHRcdFx0XHRcdFx0ZD1cIk01ODUuMyw4MTcuOEM1MjkuNCw4MzIuNiw0NzAuNSw4MzIuNiw0MTQuNiw4MTcuN0M0MDcsODE1LjcsMzk4LDgyMC4yLDM5Ni4xLDgyOC4yQzM5NC4zLDgzNi4xLDM5OC41LDg0NC41LDQwNi42LDg0Ni43QzQ2Ny41LDg2Mi45LDUzMi4zLDg2Mi45LDU5My4yLDg0Ni44QzYwMSw4NDQuNyw2MDUuOCw4MzYuMSw2MDMuNyw4MjguM0M2MDEuNiw4MjAuNCw1OTMuMiw4MTUuOCw1ODUuMyw4MTcuOEw1ODUuMyw4MTcuOFpcIiAvPlxuXHRcdFx0XHRcdFx0XHQ8L2c+XG5cdFx0XHRcdFx0XHQ8L2c+XG5cdFx0XHRcdFx0XHQ8ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTU1LjgsLTAuMDM3MjIxNSlcIj5cblx0XHRcdFx0XHRcdFx0PGc+XG5cdFx0XHRcdFx0XHRcdFx0PHBhdGhcblx0XHRcdFx0XHRcdFx0XHRcdGQ9XCJNMTgxLjEsNDEzLjZDMTk2LjIsMzU3LjUsMjI1LjcsMzA2LjcsMjY2LjYsMjY1LjZDMjcyLjMsMjU5LjksMjcyLjMsMjUwLjEsMjY2LjYsMjQ0LjRDMjYwLjksMjM4LjcsMjUxLjEsMjM4LjYsMjQ1LjQsMjQ0LjRDMjAxLDI4OSwxNjguNSwzNDQuOCwxNTIuMiw0MDUuNkMxNTAuMiw0MTMuMiwxNTQuNyw0MjIuMiwxNjIuNyw0MjQuMUMxNzAuNSw0MjUuOSwxNzguOSw0MjEuNywxODEuMSw0MTMuNkwxODEuMSw0MTMuNlpcIiAvPlxuXHRcdFx0XHRcdFx0XHQ8L2c+XG5cdFx0XHRcdFx0XHQ8L2c+XG5cdFx0XHRcdFx0XHQ8ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTU1LjgsLTAuMDM3MjIxNSlcIj5cblx0XHRcdFx0XHRcdFx0PGc+XG5cdFx0XHRcdFx0XHRcdFx0PHBhdGhcblx0XHRcdFx0XHRcdFx0XHRcdGQ9XCJNNzMzLjQsMjY1LjVDNzc0LjQsMzA2LjYsODAzLjgsMzU3LjQsODE4LjksNDEzLjVDODIxLDQyMS4zLDgyOS42LDQyNi4xLDgzNy40LDQyNEM4NDUuMyw0MjEuOCw4NTAsNDEzLjQsODQ3LjksNDA1LjVDODMxLjUsMzQ0LjcsNzk5LjEsMjg4LjgsNzU0LjYsMjQ0LjJDNzQ4LjksMjM4LjUsNzM5LjEsMjM4LjUsNzMzLjQsMjQ0LjJDNzI3LjYsMjUwLjEsNzI3LjYsMjU5LjgsNzMzLjQsMjY1LjVMNzMzLjQsMjY1LjVaXCIgLz5cblx0XHRcdFx0XHRcdFx0PC9nPlxuXHRcdFx0XHRcdFx0PC9nPlxuXHRcdFx0XHRcdDwvZz5cblx0XHRcdFx0PC9zdmc+XG5cdFx0XHQ8L2Rpdj5cblx0XHRcdDwhLS0geEpTRSBsb2dvIC0tPlxuXHRcdDwvc3VtbWFyeT5cblx0XHQ8IS0tIHhDYXB0Y2hhIFBhbmVsIC0tPlxuXG5cdFx0PCEtLSBDYXB0Y2hhIEdhbWUgLS0+XG5cdFx0PGRpdiBpZD1cIkpTRS1DYXB0Y2hhRGlzcGxheVwiPlxuXHRcdFx0PGRpdiBpZD1cIkpTRS1jYXB0Y2hhLWdhbWUtY29udGFpbmVyXCIgb246bW91c2Vtb3ZlPVwie2hhbmRsZU1vdmVtZW50fVwiIG9uOnRvdWNobW92ZT1cIntoYW5kbGVNb3ZlbWVudH1cIj5cblx0XHRcdHsjaWYgb3Blbn1cdFxuXHRcdFx0XHQ8ZGl2IGlkPVwiSlNFLWNhcHRjaGEtZ2FtZVwiPlxuXHRcdFx0XHRcdDxBc3Rlcm9pZHMgb246Y29tcGxldGU9XCJ7Y2FsbGJhY2tGdW5jdGlvbn1cIiAvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdHsvaWZ9XG5cdFx0XHQ8L2Rpdj5cblx0XHQ8L2Rpdj5cblx0XHQ8IS0tIHhDYXB0Y2hhIEdhbWUgLS0+XG5cdDwvZGV0YWlscz5cbjwvc2VjdGlvbj5cbjwhLS0geEpTRSBDYXB0Y2hhIC0tPlxuXG5cblxuXG48c2NyaXB0PlxuXHQvL2xpYnNcblx0aW1wb3J0IHsgb25Nb3VudCwgY3JlYXRlRXZlbnREaXNwYXRjaGVyIH0gZnJvbSAnc3ZlbHRlJztcblx0aW1wb3J0IEFzdGVyb2lkcyBmcm9tICcuL0FzdGVyb2lkcy5zdmVsdGUnXG5cblx0Ly9Qcm9wc1xuXHRleHBvcnQgbGV0IHNpemUgPSAnTCc7XG5cdGV4cG9ydCBsZXQgdGhlbWUgPSAnZmxhdCc7XG5cdGV4cG9ydCBsZXQgY2FwdGNoYVNlcnZlciA9ICdodHRwczovL2xvYWQuanNlY29pbi5jb20nO1xuXG5cdC8vRXZlbnRzXG5cdGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKCk7XG5cdFxuXHQvL0luaXQgY2FwdGNoYVxuXHRsZXQgb3BlbiA9IGZhbHNlO1xuXHRsZXQgc2hvd0NhcHRjaGEgPSBmYWxzZTtcblx0bGV0IGNhcHRjaGFDaGVjayA9IGZhbHNlO1xuXHRsZXQgY29tcGxldGUgPSBmYWxzZTtcblxuXHRzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRzaG93Q2FwdGNoYSA9IHRydWU7XG5cdH0sIDEwKTtcblxuXHQvL01vdW50ZWRcblx0b25Nb3VudCgoKSA9PiB7XG5cdH0pO1xuXG5cdC8vU3VjY2Vzc1xuXHRkaXNwYXRjaCgnc3VjY2VzcycsICdzdWNjZXNzIGV2ZW50IHNlbnQnKTtcblxuXHQvL01ldGhvZHNcblx0LyoqXG4gICAgICogcmVxdWVzdFVSTFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXF1ZXN0XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHJlcXVlc3QubWV0aG9kIFRoZSBIVFRQIG1ldGhvZCB0byB1c2UgZm9yIHRoZSByZXF1ZXN0LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXF1ZXN0LnVybCBUaGUgVVJMIGZvciB0aGUgcmVxdWVzdFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXF1ZXN0LmNvbnRlbnQgVGhlIGJvZHkgY29udGVudCBmb3IgdGhlIHJlcXVlc3QuIE1heSBiZSBhIHN0cmluZyBvciBhbiBBcnJheUJ1ZmZlciAoZm9yIGJpbmFyeSBkYXRhKS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVxdWVzdC5oZWFkZXJzIEFuIG9iamVjdCBkZXNjcmliaW5nIGhlYWRlcnMgdG8gYXBwbHkgdG8gdGhlIHJlcXVlc3QgeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXF1ZXN0LnJlc3BvbnNlVHlwZSBUaGUgWE1MSHR0cFJlcXVlc3RSZXNwb25zZVR5cGUgdG8gYXBwbHkgdG8gdGhlIHJlcXVlc3QuXG4gICAgICogQHBhcmFtIHtib29sZWFufSByZXF1ZXN0LmFib3J0U2lnbmFsIEFuIEFib3J0U2lnbmFsIHRoYXQgY2FuIGJlIG1vbml0b3JlZCBmb3IgY2FuY2VsbGF0aW9uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXF1ZXN0LnRpbWVvdXQgVGhlIHRpbWUgdG8gd2FpdCBmb3IgdGhlIHJlcXVlc3QgdG8gY29tcGxldGUgYmVmb3JlIHRocm93aW5nIGEgVGltZW91dEVycm9yLiBNZWFzdXJlZCBpbiBtaWxsaXNlY29uZHMuXG4gICAgICovXG4gICAgY29uc3QgcmVxdWVzdFVSTCA9IChyZXF1ZXN0KSA9PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSAoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgICAgICAgIHhoci5vcGVuKHJlcXVlc3QubWV0aG9kLCByZXF1ZXN0LnVybCwgdHJ1ZSk7XG4gICAgICAgICAgICAvL3hoci53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ1gtUmVxdWVzdGVkLVdpdGgnLCAnWE1MSHR0cFJlcXVlc3QnKTtcblxuICAgICAgICAgICAgLy9zZXQgaGVhZGVyc1xuICAgICAgICAgICAgaWYgKHJlcXVlc3QuaGVhZGVycykge1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKHJlcXVlc3QuaGVhZGVycylcbiAgICAgICAgICAgICAgICAgICAgLmZvckVhY2goKGhlYWRlcikgPT4geGhyLnNldFJlcXVlc3RIZWFkZXIoaGVhZGVyLCByZXF1ZXN0LmhlYWRlcnNbaGVhZGVyXSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL3NldCByZXNwb25zZSB0eXBlXG4gICAgICAgICAgICBpZiAocmVxdWVzdC5yZXNwb25zZVR5cGUpIHtcbiAgICAgICAgICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gcmVxdWVzdC5yZXNwb25zZVR5cGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vYWJvcnQgcmVxXG4gICAgICAgICAgICBpZiAocmVxdWVzdC5hYm9ydFNpZ25hbCkge1xuICAgICAgICAgICAgICAgIHJlcXVlc3QuYWJvcnRTaWduYWwub25hYm9ydCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgeGhyLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy90aW1lb3V0IHRpbWVcbiAgICAgICAgICAgIGlmIChyZXF1ZXN0LnRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICB4aHIudGltZW91dCA9IHJlcXVlc3QudGltZW91dDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9vbiBzdGF0ZSBjaGFuZ2VcbiAgICAgICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXF1ZXN0LmFib3J0U2lnbmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmFib3J0U2lnbmFsLm9uYWJvcnQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gU29tZSBicm93c2VycyByZXBvcnQgeGhyLnN0YXR1cyA9PSAwIHdoZW4gdGhlXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlc3BvbnNlIGhhcyBiZWVuIGN1dCBvZmYgb3IgdGhlcmUncyBiZWVuIGEgVENQIEZJTi5cbiAgICAgICAgICAgICAgICAgICAgLy8gVHJlYXQgaXQgbGlrZSBhIDIwMCB3aXRoIG5vIHJlc3BvbnNlLlxuICAgICAgICAgICAgICAgICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogMjAwLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXNUZXh0OiB4aHIuc3RhdHVzVGV4dCB8fCBudWxsLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiB4aHIucmVzcG9uc2UgfHwgeGhyLnJlc3BvbnNlVGV4dCB8fCBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoeGhyLnN0YXR1cyA+PSAyMDAgJiYgeGhyLnN0YXR1cyA8IDMwMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogeGhyLnN0YXR1cywgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzVGV4dDogeGhyLnN0YXR1c1RleHQsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHhoci5yZXNwb25zZSB8fCB4aHIucmVzcG9uc2VUZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3Qoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZTogeGhyLnN0YXR1c1RleHQsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IHhoci5zdGF0dXMsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vY2F0Y2ggZXJyb3JzXG4gICAgICAgICAgICB4aHIub25lcnJvciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3Qoe1xuICAgICAgICAgICAgICAgICAgICBlcnJvck1lc3NhZ2U6IHhoci5zdGF0dXNUZXh0LCBcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogeGhyLnN0YXR1c1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy90aW1lb3V0XG4gICAgICAgICAgICB4aHIub250aW1lb3V0ID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdCh7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZTogJ0EgdGltZW91dCBvY2N1cnJlZCcsIFxuICAgICAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiAndGltZW91dCcsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvL2luaXQgcmVxXG4gICAgICAgICAgICB4aHIuc2VuZChyZXF1ZXN0LmNvbnRlbnQgfHwgJycpO1xuICAgICAgICB9KTtcblx0fTtcblxuXHQvKipcblx0ICogbG9hZEdhbWVcblx0ICogZGlzYWJsZWQgdW50aWwgZmlndXJlIGJlc3Qgd2F5IHRvIGRvIGNvZGUgc3BsaXR0aW5nLi4uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGdhbWVGaWxlIHVybCBvZiBnYW1lZmlsZSB0byBsb2FkXG4gICAgICogQHBhcmFtIHtjYWxsYmFja30gY2IgQ2FsbGJhY2sgZnVuY3Rpb25cblx0ICovXG5cdGNvbnN0IGxvYWRHYW1lID0gKGdhbWVGaWxlLGNiKSA9PiB7XG5cdFx0Lypcblx0XHQgLy9yZXF1ZXN0IGNvbmZcbiAgICAgICAgcmVxdWVzdFVSTCh7XG4gICAgICAgICAgICBtZXRob2Q6ICdnZXQnLFxuICAgICAgICAgICAgdXJsOiBgJHtjYXB0Y2hhU2VydmVyfS9jYXB0Y2hhL2xvYWQvJHtnYW1lRmlsZX1gXG4gICAgICAgIC8vc3VjY2Vzc1xuICAgICAgICB9KS50aGVuKChyZXMpID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKCdbcmVzXVtsb2FkQ29uZl0nLHJlcyk7XG5cdFx0XHRjYihyZXMuY29udGVudCk7XG4gICAgICAgICAgICBcbiAgICAgICAgLy9lcnJvclxuICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG5cdFx0fSk7XG5cdFx0Ki9cblx0fVxuXG5cdC8qKlxuXHQgKiBnYW1lQ29tcGxldGVkXG5cdCAqIGRpc2FibGVkIHVudGlsIGZpZ3VyZSBiZXN0IHdheSB0byBkbyBjb2RlIHNwbGl0dGluZy4uLlxuXHQgKi9cblx0Y29uc3QgZ2FtZUNvbXBsZXRlZCA9ICgpID0+IHtcblx0XHQvKlxuXHRcdG1sRGF0YS5maW5pc2hUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cdFx0bWxEYXRhLmdhbWVzQ29tcGxldGVkICs9IDE7XG5cdFx0c3VibWl0TUxEYXRhKFxuXHRcdChyZXMpID0+IHtcblx0XHRcdHZhciBKU0VDYXB0Y2hhUGFzcyA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuXHRcdFx0SlNFQ2FwdGNoYVBhc3MuaW5pdEV2ZW50KCdKU0VDYXB0Y2hhUGFzcycsIHRydWUsIHRydWUpO1xuXHRcdFx0SlNFQ2FwdGNoYVBhc3MuaXAgPSByZXMuaXA7XG5cdFx0XHRKU0VDYXB0Y2hhUGFzcy5yYXRpbmcgPSByZXMucmF0aW5nO1xuXHRcdFx0SlNFQ2FwdGNoYVBhc3MucGFzcyA9IHJlcy5wYXNzO1xuXHRcdFx0ZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChKU0VDYXB0Y2hhUGFzcyk7XG5cdFx0XHRzZWxmLkpTRUNhcHRjaGFDb21wbGV0ZWQgPSB0cnVlO1xuXHRcdH0sIChyZXMpID0+IHtcblx0XHRcdGxvYWRSYW5kb21HYW1lKCk7XG5cdFx0fSk7Ki9cblx0fTtcblxuXHQvKipcblx0ICogbG9hZFJhbmRvbUdhbWVcblx0ICogbG9hZHMgcmFuZG9tIGdhbWUgZml4ZWQgdG8gYXN0ZXJvaWRzIGZvciBub3cuLlxuXHQgKi9cblx0Y29uc3QgbG9hZFJhbmRvbUdhbWUgPSAoKSA9PiB7XG5cdFx0Ly9jb25zdCBnYW1lcyA9IFsnYXN0ZXJvaWRzLmpzJywgJ3RpY3RhY3RvZS5qcycsICdwaWxvdC5qcyddOyBcblx0XHRjb25zdCBnYW1lcyA9IFsnYXN0ZXJvaWRzLmpzJ107IFxuXHRcdGNvbnN0IGNob29zZW5HYW1lID0gZ2FtZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKmdhbWVzLmxlbmd0aCldO1xuXHRcdGxvYWRHYW1lKGNob29zZW5HYW1lLCAoZ2FtZUNvZGUpID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKGdhbWVDb2RlKTtcblx0XHRcdGNvbnN0IGdhbWUgPSBuZXcgRnVuY3Rpb24oZ2FtZUNvZGUpO1xuXHRcdFx0Z2FtZSgpO1xuXHRcdH0pO1xuXHR9XG5cblx0Ly9EYXRhXG4gXHRjb25zdCBtbERhdGEgPSB7XG5cdFx0bG9hZFRpbWU6IG5ldyBEYXRlKCkuZ2V0VGltZSgpLFxuXHRcdHRpY2tUaW1lOiAwLFxuXHRcdGZpbmlzaFRpbWU6IDAsXG5cdFx0bW91c2VYOiAwLFxuXHRcdG1vdXNlWTogMCxcblx0XHRtb3VzZVVwOiAwLFxuXHRcdG1vdXNlRG93bjogMCxcblx0XHRtb3VzZUxlZnQ6IDAsXG5cdFx0bW91c2VSaWdodDogMCxcblx0XHRtb3VzZUNsaWNrczogMCxcblx0XHRtb3VzZUV2ZW50czogMCxcblx0XHRtb3VzZVBhdHRlcm46IFtdLFxuXHRcdGdhbWVzQ29tcGxldGVkOiAwLFxuXHRcdGNoZWNrQm94OiAwXG5cdH07XG5cblx0bWxEYXRhLnVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuXHRtbERhdGEudXNlckFnZW50ID0gbmF2aWdhdG9yLnVzZXJBZ2VudCB8fCAwO1xuXHRtbERhdGEucGxhdGZvcm0gPSBuYXZpZ2F0b3IucGxhdGZvcm0gfHwgMDtcblx0bWxEYXRhLnJlZmVycmVyID0gZG9jdW1lbnQucmVmZXJyZXIgfHwgMDtcblx0bWxEYXRhLnJ1bk9uY2UgPSB3aW5kb3cuSlNFUnVuT25jZSB8fCBmYWxzZTtcblx0bWxEYXRhLmxhbmd1YWdlID0gd2luZG93Lm5hdmlnYXRvci5sYW5ndWFnZSB8fCAwO1xuXG5cdGlmIChuYXZpZ2F0b3IubGFuZ3VhZ2VzKSB7IFxuXHRcdG1sRGF0YS5sYW5ndWFnZXMgPSBuYXZpZ2F0b3IubGFuZ3VhZ2VzLmpvaW4oJycpIHx8IDA7XG5cdH0gZWxzZSB7XG5cdFx0bWxEYXRhLmxhbmd1YWdlcyA9IDE7XG5cdH1cblxuXHRtbERhdGEudGltZXpvbmVPZmZzZXQgPSBuZXcgRGF0ZSgpLmdldFRpbWV6b25lT2Zmc2V0KCkgfHwgMDtcblx0bWxEYXRhLmFwcE5hbWUgPSB3aW5kb3cubmF2aWdhdG9yLmFwcE5hbWUgfHwgMDtcblx0bWxEYXRhLnNjcmVlbldpZHRoID0gd2luZG93LnNjcmVlbi53aWR0aCB8fCAwO1xuXHRtbERhdGEuc2NyZWVuSGVpZ2h0ID0gd2luZG93LnNjcmVlbi5oZWlnaHQgfHwgMDtcblx0bWxEYXRhLnNjcmVlbkRlcHRoID0gd2luZG93LnNjcmVlbi5jb2xvckRlcHRoIHx8IDA7XG5cdG1sRGF0YS5zY3JlZW4gPSBtbERhdGEuc2NyZWVuV2lkdGgrJ3gnK21sRGF0YS5zY3JlZW5IZWlnaHQrJ3gnK21sRGF0YS5zY3JlZW5EZXB0aDsgLy8gMTkyMHgxMDgweDI0XG5cdG1sRGF0YS5pbm5lcldpZHRoID0gd2luZG93LmlubmVyV2lkdGggfHwgMDtcblx0bWxEYXRhLmlubmVySGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0IHx8IDA7XG5cdG1sRGF0YS5kZXZpY2VNZW1vcnkgPSBuYXZpZ2F0b3IuZGV2aWNlTWVtb3J5IHx8IG5hdmlnYXRvci5oYXJkd2FyZUNvbmN1cnJlbmN5IHx8IDA7XG5cdG1sRGF0YS5wcm90b1N0cmluZyA9IE9iamVjdC5rZXlzKG5hdmlnYXRvci5fX3Byb3RvX18pLmpvaW4oJycpLnN1YnN0cmluZygwLCAxMDApIHx8IDA7XG5cblx0aWYgKHdpbmRvdy5mcmFtZUVsZW1lbnQgPT09IG51bGwpIHtcblx0XHRtbERhdGEuaUZyYW1lID0gZmFsc2U7XG5cdH0gZWxzZSB7XG5cdFx0bWxEYXRhLmlGcmFtZSA9IHRydWU7XG5cdH1cblx0XG5cblxuXHQvL29uIGRldGFpbHMgb3BlblxuXHQkOiBpZiAob3Blbikge1xuXHRcdG1sRGF0YS50aWNrVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdGxvYWRSYW5kb21HYW1lKCk7XG5cdH0gZWxzZSB7XG5cblx0fVxuXG5cdC8vaW5wdXQgc2VsZWN0ZWRcblx0JDogbWxEYXRhLmNoZWNrQm94ID0gKGNhcHRjaGFDaGVjayk/MTowO1xuXG5cdC8vdHJhY2sgbW92ZW1lbnRcblx0Y29uc3QgaGFuZGxlTW92ZW1lbnQgPSAoZSkgPT4ge1xuXHRcdGNvbnN0IHJlY3QgPSBlLmN1cnJlbnRUYXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0aWYgKGUucGFnZVggPT09IG51bGwpIHtcblx0XHRcdGNvbnN0IGVEb2MgPSAoZS50YXJnZXQgJiYgZS50YXJnZXQub3duZXJEb2N1bWVudCkgfHwgZG9jdW1lbnQ7XG5cdFx0XHRjb25zdCBkb2MgPSBlRG9jLmRvY3VtZW50RWxlbWVudDtcblx0XHRcdGNvbnN0IGJvZHkgPSBlRG9jLmJvZHk7XG5cdFx0XHRlLnBhZ2VYID0gTWF0aC5mbG9vcigoZS50b3VjaGVzICYmIGUudG91Y2hlc1swXS5jbGllbnRYIHx8IGUuY2xpZW50WCB8fCAwKSArXG5cdFx0XHRcdChkb2MgJiYgZG9jLnNjcm9sbExlZnQgfHwgYm9keSAmJiBib2R5LnNjcm9sbExlZnQgfHwgMCkgLVxuXHRcdFx0XHQoZG9jICYmIGRvYy5jbGllbnRMZWZ0IHx8IGJvZHkgJiYgYm9keS5jbGllbnRMZWZ0IHx8IDApKTtcblx0XHRcdGUucGFnZVkgPSBNYXRoLmZsb29yKChlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdLmNsaWVudFkgfHwgZS5jbGllbnRZIHx8IDApICtcblx0XHRcdFx0KGRvYyAmJiBkb2Muc2Nyb2xsVG9wIHx8IGJvZHkgJiYgYm9keS5zY3JvbGxUb3AgfHwgMCkgLVxuXHRcdFx0XHQoZG9jICYmIGRvYy5jbGllbnRUb3AgfHwgYm9keSAmJiBib2R5LmNsaWVudFRvcCB8fCAwKSk7XG5cdFx0fVxuXHRcdGNvbnN0IG1vdXNlWCA9IGUucGFnZVggLSByZWN0LmxlZnQ7XG5cdFx0Y29uc3QgbW91c2VZID0gZS5wYWdlWSAtIHJlY3QudG9wO1xuXG5cdFx0bWxEYXRhLm1vdXNlRXZlbnRzICs9IDE7XG5cdFx0aWYgKG1vdXNlWSA8IG1sRGF0YS5tb3VzZVkpIG1sRGF0YS5tb3VzZURvd24gKz0gMTtcblx0XHRpZiAobW91c2VZID4gbWxEYXRhLm1vdXNlWSkgbWxEYXRhLm1vdXNlVXAgKz0gMTtcblx0XHRpZiAobW91c2VYID4gbWxEYXRhLm1vdXNlWCkgbWxEYXRhLm1vdXNlUmlnaHQgKz0gMTtcblx0XHRpZiAobW91c2VYIDwgbWxEYXRhLm1vdXNlWCkgbWxEYXRhLm1vdXNlTGVmdCArPSAxO1xuXG5cdFx0bWxEYXRhLm1vdXNlWCA9IG1vdXNlWDtcblx0XHRtbERhdGEubW91c2VZID0gbW91c2VZO1xuXHRcdG1sRGF0YS5tb3VzZVBhdHRlcm4ucHVzaChwYXJzZUludChtb3VzZVgpICsgJ3gnICsgcGFyc2VJbnQobW91c2VZKSk7XG5cdH1cblx0XG5cdGNvbnN0IGNhbGxiYWNrRnVuY3Rpb24gPSAoZSkgPT4ge1xuXHRcdGNvbnNvbGUubG9nKCdjb21wbGV0ZScpXG5cdFx0bWxEYXRhLmdhbWVzQ29tcGxldGVkICs9IDE7XG5cdFx0bWxEYXRhLm1vdXNlQ2xpY2tzID0gZS5kZXRhaWwubW91c2VDbGlja3M7XG5cdFx0bWxEYXRhLmZpbmlzaFRpbWUgPSBlLmRldGFpbC5maW5pc2hUaW1lOyBcblx0XHRcblx0XHQvL2Nsb3NlIGNhcHRjaGFcblx0XHRvcGVuID0gZmFsc2U7XG5cblx0XHQvL3N1Ym1pdCBkYXRhXG5cdFx0c3VibWl0TUxEYXRhKFxuXHRcdFx0KHJlcykgPT4ge1xuXHRcdFx0XHRjb25zdCBKU0VDYXB0Y2hhUGFzcyA9IHt9O1xuXHRcdFx0XHRKU0VDYXB0Y2hhUGFzcy5pcCA9IHJlcy5pcDtcblx0XHRcdFx0SlNFQ2FwdGNoYVBhc3MucmF0aW5nID0gcmVzLnJhdGluZztcblx0XHRcdFx0SlNFQ2FwdGNoYVBhc3MucGFzcyA9IHJlcy5wYXNzO1xuXHRcdFx0XHRcblx0XHRcdFx0ZGlzcGF0Y2goJ3N1Y2Nlc3MnLCBKU0VDYXB0Y2hhUGFzcyk7XG5cdFx0XHRcdGNvbXBsZXRlID0gdHJ1ZTtcblx0XHRcdH0sIFxuXHRcdFx0KHJlcykgPT4ge1xuXHRcdFx0XHRvcGVuID0gdHJ1ZTtcblx0XHRcdFx0ZGlzcGF0Y2goJ2ZhaWwnLCAxKTtcblx0XHRcdFx0bG9hZFJhbmRvbUdhbWUoKTtcblx0XHRcdH1cblx0XHQpO1xuXHR9XG5cblxuXHQvKipcblx0ICogc3VibWl0TUxEYXRhXG5cdCAqIHN1Ym1pdCBkYXRhIHdpdGggY2FsbGJhY2sgY29kZSBzdWNjZXMgZmFpbFxuICAgICAqIEBwYXJhbSB7Y2FsbGJhY2t9IHBhc3NDYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7Y2FsbGJhY2t9IGZhaWxDYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvblxuXHQgKi9cblx0Y29uc3Qgc3VibWl0TUxEYXRhID0gKHBhc3NDYWxsYmFjaywgZmFpbENhbGxiYWNrKSA9PiB7XG5cdFx0Y29uc3QgY2xlYW5EYXRhU3RyaW5nID0gcHJlcE1MRGF0YSgpO1xuXG5cdFx0cmVxdWVzdFVSTCh7XG4gICAgICAgICAgICBtZXRob2Q6ICdwb3N0Jyxcblx0XHRcdHVybDogYCR7Y2FwdGNoYVNlcnZlcn0vY2FwdGNoYS9yZXF1ZXN0L2AsXG5cdFx0XHRjb250ZW50OiBjbGVhbkRhdGFTdHJpbmcsXG5cdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdCdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG5cdFx0XHR9LFxuICAgICAgICAvL3N1Y2Nlc3NcbiAgICAgICAgfSkudGhlbigocmVzKSA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZygnW3Jlc11bbG9hZENvbmZdJyxyZXMpO1xuXHRcdFx0cmVzID0gSlNPTi5wYXJzZShyZXMuY29udGVudCk7XG5cdFx0XHRpZiAoKHJlcy5wYXNzKSAmJiAocmVzLnBhc3MgPT09IHRydWUpKSB7XG5cdFx0XHRcdHBhc3NDYWxsYmFjayhyZXMpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZmFpbENhbGxiYWNrKHJlcyk7XG5cdFx0XHR9XG4gICAgICAgIC8vZXJyb3JcbiAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0Y29uc29sZS5lcnJvcihlcnIpO1xuXHRcdFx0ZmFpbENhbGxiYWNrKHJlcyk7XG5cdFx0fSk7XG5cdH07XG5cblx0LyoqXG5cdCAqIHByZXBNTERhdGFcblx0ICogUHJlcGFyZSBNTCBkYXRhXG5cdCAqL1xuXHRjb25zdCBwcmVwTUxEYXRhID0gKCkgPT4ge1xuXHRcdGNvbnN0IGNsZWFuRGF0YSA9IG1sRGF0YTtcblx0XHRjbGVhbkRhdGEubW91c2VQYXR0ZXJuID0gY2xlYW5EYXRhLm1vdXNlUGF0dGVybi5zbGljZShjbGVhbkRhdGEubW91c2VQYXR0ZXJuLmxlbmd0aC0yMDAsY2xlYW5EYXRhLm1vdXNlUGF0dGVybi5sZW5ndGgpO1xuXHRcdHJldHVybiBKU09OLnN0cmluZ2lmeSh7bWxEYXRhOiBjbGVhbkRhdGF9KTtcblx0fTtcbjwvc2NyaXB0PlxuXG5cblxuXG5cbjxzdHlsZT5cbi8qKlxuKiBGTEFUXG4qKi9cbiNKU0UtQ2FwdGNoYS5mbGF0IHtcblx0YmFja2dyb3VuZDogbm9uZTtcblx0cGFkZGluZzogMHB4O1xufVxuXG4jSlNFLUNhcHRjaGEuZmxhdCBkZXRhaWxzIHtcblx0Ym94LXNoYWRvdzogMHB4IDBweCAwcHggNHB4IHJnYmEoMCwgMCwgMCwgMC4wNik7XG59XG5cbi8qKioqL1xuXG5cbi8qKlxuKiBTTUFMTFxuKiovXG4jSlNFLUNhcHRjaGEuUyB7XG5cdGJvcmRlci1yYWRpdXM6IDZweDtcblx0cGFkZGluZzogOHB4O1xuXHRtYXJnaW46IDVweDtcblx0Zm9udC1zaXplOiAxMXB4O1xufVxuXG4jSlNFLUNhcHRjaGEuUyAjSlNFLWlucHV0IHtcblx0aGVpZ2h0OiAyMHB4O1xuXHRtaW4td2lkdGg6IDIwcHg7XG5cdGZvbnQtc2l6ZTogMTVweDtcblx0Ym9yZGVyOiBzb2xpZCAxcHggI0QzRDhERDtcblx0cGFkZGluZzogMnB4O1xuXHRtYXJnaW46IDZweDtcbn1cblxuI0pTRS1DYXB0Y2hhLlMgI0pTRS1icmFuZCB7XG5cdHdpZHRoOiAzMHB4O1xuXHRib3JkZXItbGVmdDogc29saWQgMnB4ICNGOUY5Rjk7XG59XG5cbiNKU0UtQ2FwdGNoYS5TICNKU0UtYnJhbmQgc3ZnIHtcblx0d2lkdGg6IDI0cHg7XG59XG5cbiNKU0UtQ2FwdGNoYS5TLmZsYXQgZGV0YWlscyB7XG5cdGJveC1zaGFkb3c6IDBweCAwcHggMHB4IDJweCByZ2JhKDAsIDAsIDAsIDAuMDYpO1xufVxuXG4vKioqKi9cblxuLyoqXG4qIE1FRElVTVxuKiovXG4jSlNFLUNhcHRjaGEuTSB7XG5cdGJvcmRlci1yYWRpdXM6IDZweDtcblx0cGFkZGluZzogOHB4O1xuXHRtYXJnaW46IDVweDtcblx0Zm9udC1zaXplOiAxNnB4O1xufVxuXG4jSlNFLUNhcHRjaGEuTSAjSlNFLWlucHV0IHtcblx0aGVpZ2h0OiAzMHB4O1xuXHRtaW4td2lkdGg6IDMwcHg7XG5cdGZvbnQtc2l6ZTogMjJweDtcblx0Ym9yZGVyOiBzb2xpZCAycHggI0QzRDhERDtcblx0bWFyZ2luOiA4cHg7XG59XG5cbiNKU0UtQ2FwdGNoYS5NICNKU0UtYnJhbmQge1xuXHR3aWR0aDogMzhweDtcblx0Ym9yZGVyLWxlZnQ6IHNvbGlkIDJweCAjRjlGOUY5O1xuXG59XG5cbiNKU0UtQ2FwdGNoYS5NICNKU0UtYnJhbmQgc3ZnIHtcblx0d2lkdGg6IDM0cHg7XG5cdG1hcmdpbi10b3A6IDRweDtcbn1cblxuI0pTRS1DYXB0Y2hhLk0uZmxhdCBkZXRhaWxzIHtcblx0Ym94LXNoYWRvdzogMHB4IDBweCAwcHggMnB4IHJnYmEoMCwgMCwgMCwgMC4wNik7XG59XG5cbi8qKioqL1xuXG4vKipcbiogTEFSR0VcbioqL1xuI0pTRS1DYXB0Y2hhLkwge31cbjpnbG9iYWwoI0pTRS1DYXB0Y2hhLkwgaW5wdXQjY2FwdGNoYUNoZWNrKSB7XG5cdHdpZHRoOjMwcHg7XG5cdGhlaWdodDozMHB4O1xuXHRtYXJnaW46MTBweDtcbn1cbi8qKioqL1xuXG5cbi8qKlxuKiBCQVNFXG4qKi9cbiNKU0UtQ2FwdGNoYSB7XG5cdGRpc3BsYXk6bm9uZTtcblx0YmFja2dyb3VuZDogI0YyRjhGRjtcblx0Ym9yZGVyLXJhZGl1czogNnB4O1xuXHRjbGVhcjogYm90aDtcblx0cGFkZGluZzogMTNweDtcblx0bWFyZ2luOiAxMHB4O1xuXHRtaW4td2lkdGg6IDIwMHB4O1xuXHRtYXgtd2lkdGg6IDMxNHB4O1xuXHRjb2xvcjogIzcwNzA3MDtcblx0Zm9udC1zaXplOiAyMHB4O1xuXHRmb250LWZhbWlseTogJ01vbnRzZXJyYXQnLCBzYW5zLXNlcmlmO1xufVxuXG4jSlNFLUNhcHRjaGEgKiB7XG5cdC13ZWJraXQtdXNlci1zZWxlY3Q6IG5vbmU7XG5cdCAgIC1tb3otdXNlci1zZWxlY3Q6IG5vbmU7XG5cdCAgICAtbXMtdXNlci1zZWxlY3Q6IG5vbmU7XG5cdCAgICAgICAgdXNlci1zZWxlY3Q6IG5vbmU7XG59XG5cbiNKU0UtQ2FwdGNoYSBkZXRhaWxzIHtcblx0b3ZlcmZsb3c6IGhpZGRlbjtcblx0bWFyZ2luOiAwcHg7XG5cdGJhY2tncm91bmQ6ICNmZmY7XG5cdGJvcmRlci1yYWRpdXM6IDRweDtcblx0Ym94LXNoYWRvdzogMHB4IDNweCA2cHggMHB4IHJnYmEoMCwgMCwgMCwgMC4xMik7XG59XG5cbiNKU0UtQ2FwdGNoYSBkZXRhaWxzIHN1bW1hcnkge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRvdXRsaW5lOiBub25lO1xufVxuXG4jSlNFLUNhcHRjaGEgZGV0YWlscyAjSlNFLUNhcHRjaGFEaXNwbGF5IHtcblx0b3BhY2l0eTogMDtcblx0bWFyZ2luOiAwcHg7XG5cdHBhZGRpbmc6IDBweDtcblx0aGVpZ2h0OiAwcHg7XG5cdHRyYW5zaXRpb246IG9wYWNpdHkgMC4ycywgaGVpZ2h0IDAuNHM7XG5cdGJhY2tncm91bmQ6ICNmZmY7XG59XG5cbiNKU0UtQ2FwdGNoYSBkZXRhaWxzLmNhcHRjaGFQYW5lbFtvcGVuXSAjSlNFLUNhcHRjaGFEaXNwbGF5IHtcblx0LXdlYmtpdC1hbmltYXRpb24tbmFtZTogc2xpZGVEb3duO1xuXHQgICAgICAgIGFuaW1hdGlvbi1uYW1lOiBzbGlkZURvd247XG5cdC13ZWJraXQtYW5pbWF0aW9uLWR1cmF0aW9uOiAwLjNzO1xuXHQgICAgICAgIGFuaW1hdGlvbi1kdXJhdGlvbjogMC4zcztcblx0LXdlYmtpdC1hbmltYXRpb24tZmlsbC1tb2RlOiBmb3J3YXJkcztcblx0ICAgICAgICBhbmltYXRpb24tZmlsbC1tb2RlOiBmb3J3YXJkcztcblx0LXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IDAuM3M7XG5cdCAgICAgICAgYW5pbWF0aW9uLWRlbGF5OiAwLjNzO1xufVxuXG4jSlNFLUNhcHRjaGEgI0pTRS1pbnB1dCB7XG5cdGJvcmRlcjogc29saWQgNHB4ICNEM0Q4REQ7XG5cdGJvcmRlci1yYWRpdXM6IDRweDtcblx0bWFyZ2luOiAxMHB4O1xuXHRtaW4td2lkdGg6IDQwcHg7XG5cdGhlaWdodDogNDBweDtcblx0Y3Vyc29yOiBwb2ludGVyO1xuXHRmb250LXNpemU6IDI4cHg7XG5cdHRleHQtYWxpZ246IGNlbnRlcjtcblx0cG9zaXRpb246IHJlbGF0aXZlO1xuXHRvdmVyZmxvdzogaGlkZGVuO1xufVxuXG4jSlNFLUNhcHRjaGEgZGV0YWlscz5zdW1tYXJ5Ojotd2Via2l0LWRldGFpbHMtbWFya2VyIHtcblx0ZGlzcGxheTogbm9uZTtcbn1cblxuI0pTRS1DYXB0Y2hhIGRldGFpbHMgI0pTRS1pbnB1dDpob3ZlcjpiZWZvcmUge1xuXHRjb250ZW50OiAn8J+klic7XG5cdG9wYWNpdHk6IDE7XG59XG5cbiNKU0UtQ2FwdGNoYS5zdWNjZXNzIGRldGFpbHMgI0pTRS1pbnB1dDpiZWZvcmUge1xuXHRjb250ZW50OiAn8J+YiSc7XG5cdG9wYWNpdHk6IDE7XG59XG5cbiNKU0UtQ2FwdGNoYS5zdWNjZXNzIGRldGFpbHMgI0pTRS1pbnB1dDphZnRlciB7XG5cdGNvbnRlbnQ6ICfinJQnO1xuXHRvcGFjaXR5OiAxO1xuXHRjb2xvcjogIzI2QUU2MDtcblx0cGFkZGluZzogMHB4IDRweCAwcHggNXB4O1xuXHRib3JkZXItbGVmdDogc29saWQgMnB4ICNEM0Q4REQ7XG59XG5cblxuI0pTRS1DYXB0Y2hhLnN1Y2Nlc3MgZGV0YWlscy5jYXB0Y2hhUGFuZWxbb3Blbl0gI0pTRS1pbnB1dDphZnRlciB7XG5cdGNvbnRlbnQ6ICcnO1xuXHRvcGFjaXR5OiAwO1xuXHRwYWRkaW5nOiAwcHg7XG5cdGJvcmRlcjogMHB4O1xuXHRcbn1cblxuI0pTRS1DYXB0Y2hhIGRldGFpbHMgI0pTRS1pbnB1dDpiZWZvcmUsXG4jSlNFLUNhcHRjaGEgZGV0YWlscy5jYXB0Y2hhUGFuZWxbb3Blbl0gI0pTRS1pbnB1dDpiZWZvcmUge1xuXHRvcGFjaXR5OiAwO1xuXHQvKmZvbnQtc2l6ZTogMjhweDsqL1xuXHRjb250ZW50OiAn8J+klic7XG5cdHRyYW5zaXRpb246IG9wYWNpdHkgMC4ycztcblx0cG9zaXRpb246IGFic29sdXRlO1xuXHR0b3A6MHB4O1xuXHRsZWZ0OjBweDtcblx0Ym90dG9tOjBweDtcblx0cmlnaHQ6MHB4O1xuXHRiYWNrZ3JvdW5kOiNmZmY7XG59XG4jSlNFLUNhcHRjaGEuc3VjY2VzcyBkZXRhaWxzLmNhcHRjaGFQYW5lbCAjSlNFLWlucHV0OmJlZm9yZSB7XG5cdHJpZ2h0OjUwJTtcbn1cbiNKU0UtQ2FwdGNoYS5zdWNjZXNzIGRldGFpbHMuY2FwdGNoYVBhbmVsW29wZW5dICNKU0UtaW5wdXQ6YWZ0ZXIge1xuXHRkaXNwbGF5OiBub25lO1xufVxuI0pTRS1DYXB0Y2hhLnN1Y2Nlc3MgZGV0YWlscy5jYXB0Y2hhUGFuZWwgI0pTRS1pbnB1dDphZnRlciB7XG5cdGxlZnQ6NTAlO1xuXHRwb3NpdGlvbjogYWJzb2x1dGU7XG5cdHRvcDowcHg7XG5cdGJvdHRvbTowcHg7XG5cdHJpZ2h0OjBweDtcblx0YmFja2dyb3VuZDojZmZmO1xufVxuI0pTRS1DYXB0Y2hhLnN1Y2Nlc3MgI0pTRS1pbnB1dCB7XG5cdG1pbi13aWR0aDo1MnB4O1xufVxuI0pTRS1DYXB0Y2hhLnN1Y2Nlc3MgZGV0YWlscy5jYXB0Y2hhUGFuZWxbb3Blbl0gI0pTRS1pbnB1dCB7XG5cdG1pbi13aWR0aDoyMHB4O1xufVxuXG4jSlNFLUNhcHRjaGEgZGV0YWlscy5jYXB0Y2hhUGFuZWxbb3Blbl0gI0pTRS1pbnB1dDpiZWZvcmUge1xuXHRvcGFjaXR5OiAxO1xufVxuXG4jSlNFLUNhcHRjaGEgI0pTRS1tc2cge1xuXHRhbGlnbi1zZWxmOiBjZW50ZXI7XG5cdHBhZGRpbmc6IDBweCAwcHggMHB4IDRweDtcblx0ZmxleDogMTtcbn1cblxuI0pTRS1DYXB0Y2hhICNKU0UtbXNnIHAge1xuXHR2ZXJ0aWNhbC1hbGlnbjogYm90dG9tO1xuXHRkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG5cdG1hcmdpbjogMHB4O1xuXHRsaW5lLWhlaWdodDogMS4yO1xufVxuXG4jSlNFLUNhcHRjaGEgI0pTRS1icmFuZCB7XG5cdGJvcmRlci1sZWZ0OiBzb2xpZCAzcHggI0Y5RjlGOTtcblx0YWxpZ24tc2VsZjogY2VudGVyO1xuXHR3aWR0aDogNjBweDtcblx0cGFkZGluZzogMHB4IDRweDtcblx0dGV4dC1hbGlnbjogY2VudGVyO1xufVxuXG4jSlNFLUNhcHRjaGEgI0pTRS1icmFuZCBzdmcge1xuXHRmaWxsOiAjNTFCRkVDO1xuXHR3aWR0aDogNDhweDtcbn1cblxuI0pTRS1DYXB0Y2hhICNKU0UtQ2FwdGNoYURpc3BsYXkgI0pTRS1jYXB0Y2hhLWdhbWUtY29udGFpbmVyIHtcblx0YmFja2dyb3VuZDogI0YyRjhGRjtcblx0Ym9yZGVyLXJhZGl1czogNnB4O1xuXHRoZWlnaHQ6IDEwMCU7XG5cdHBvc2l0aW9uOnJlbGF0aXZlO1xuXHRvdmVyZmxvdzpoaWRkZW47XG59XG4jSlNFLUNhcHRjaGEgI0pTRS1DYXB0Y2hhRGlzcGxheSAjSlNFLWNhcHRjaGEtZ2FtZSB7XG5cdGhlaWdodDoxMDAlO1xufVxuXG5cbkAtd2Via2l0LWtleWZyYW1lcyBzbGlkZURvd24ge1xuXHRmcm9tIHtcblx0XHRvcGFjaXR5OiAwO1xuXHRcdGhlaWdodDogMDtcblx0XHRwYWRkaW5nOiA4cHg7XG5cdFx0Ym9yZGVyLXRvcDogc29saWQgNHB4ICNGOUY5Rjk7XG5cdH1cblxuXHR0byB7XG5cdFx0b3BhY2l0eTogMTtcblx0XHRoZWlnaHQ6IDE5MHB4O1xuXHRcdHBhZGRpbmc6IDhweDtcblx0XHRib3JkZXItdG9wOiBzb2xpZCA0cHggI0Y5RjlGOTtcblx0XHQvKmhlaWdodDogdmFyKC0tY29udGVudEhlaWdodCk7Ki9cblx0fVxufVxuXG5cbkBrZXlmcmFtZXMgc2xpZGVEb3duIHtcblx0ZnJvbSB7XG5cdFx0b3BhY2l0eTogMDtcblx0XHRoZWlnaHQ6IDA7XG5cdFx0cGFkZGluZzogOHB4O1xuXHRcdGJvcmRlci10b3A6IHNvbGlkIDRweCAjRjlGOUY5O1xuXHR9XG5cblx0dG8ge1xuXHRcdG9wYWNpdHk6IDE7XG5cdFx0aGVpZ2h0OiAxOTBweDtcblx0XHRwYWRkaW5nOiA4cHg7XG5cdFx0Ym9yZGVyLXRvcDogc29saWQgNHB4ICNGOUY5Rjk7XG5cdFx0LypoZWlnaHQ6IHZhcigtLWNvbnRlbnRIZWlnaHQpOyovXG5cdH1cbn1cblxuI0pTRS1DYXB0Y2hhIGRldGFpbHMgI0pTRS1tc2c+cDphZnRlciB7XG5cdGNvbnRlbnQ6ICdJbSBodW1hbic7XG59XG5cbiNKU0UtQ2FwdGNoYSBkZXRhaWxzLmNhcHRjaGFQYW5lbFtvcGVuXSAjSlNFLW1zZz5wOmFmdGVyLFxuI0pTRS1DYXB0Y2hhLnN1Y2Nlc3MgZGV0YWlscy5jYXB0Y2hhUGFuZWxbb3Blbl0gI0pTRS1tc2c+cDphZnRlciB7XG5cdGNvbnRlbnQ6ICdJbSBub3QgYSByb2JvdCc7XG59XG5cbiNKU0UtQ2FwdGNoYS5zdWNjZXNzIGRldGFpbHMgI0pTRS1tc2c+cDphZnRlciB7XG5cdGNvbnRlbnQ6ICdWZXJpZmllZCBodW1hbic7XG59XG5cbiNKU0UtaW5wdXQgaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdIHtcblx0Lypwb3NpdGlvbjogYWJzb2x1dGU7XG5cdHRvcDogLTUwcHg7Ki9cbn1cbiNKU0UtQ2FwdGNoYS5hY3RpdmUge1xuXHRkaXNwbGF5OmJsb2NrO1xufVxuLyoqKiovXG5cblxuLmdmeCB7XG5cdHBvc2l0aW9uOmFic29sdXRlO1xuXHRvcGFjaXR5OjE7XG5cdHRyYW5zaXRpb246IG9wYWNpdHkgMC42cztcbn1cblxuLmdmeC5hY3RpdmUge1xuXHRvcGFjaXR5OjA7XG59XG5cbi8qIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbk55WXk5amIyMXdiMjVsYm5SekwwcFRSVU5oY0hSamFHRXVjM1psYkhSbElsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN1FVRkRRVHM3UlVGRlJUdEJRVU5HTzBOQlEwTXNaMEpCUVdkQ08wTkJRMmhDTEZsQlFWazdRVUZEWWpzN1FVRkZRVHREUVVORExDdERRVUVyUXp0QlFVTm9SRHM3UVVGRlFTeExRVUZMT3pzN1FVRkhURHM3UlVGRlJUdEJRVU5HTzBOQlEwTXNhMEpCUVd0Q08wTkJRMnhDTEZsQlFWazdRMEZEV2l4WFFVRlhPME5CUTFnc1pVRkJaVHRCUVVOb1FqczdRVUZGUVR0RFFVTkRMRmxCUVZrN1EwRkRXaXhsUVVGbE8wTkJRMllzWlVGQlpUdERRVU5tTEhsQ1FVRjVRanREUVVONlFpeFpRVUZaTzBOQlExb3NWMEZCVnp0QlFVTmFPenRCUVVWQk8wTkJRME1zVjBGQlZ6dERRVU5ZTERoQ1FVRTRRanRCUVVNdlFqczdRVUZGUVR0RFFVTkRMRmRCUVZjN1FVRkRXanM3UVVGRlFUdERRVU5ETEN0RFFVRXJRenRCUVVOb1JEczdRVUZGUVN4TFFVRkxPenRCUVVWTU96dEZRVVZGTzBGQlEwWTdRMEZEUXl4clFrRkJhMEk3UTBGRGJFSXNXVUZCV1R0RFFVTmFMRmRCUVZjN1EwRkRXQ3hsUVVGbE8wRkJRMmhDT3p0QlFVVkJPME5CUTBNc1dVRkJXVHREUVVOYUxHVkJRV1U3UTBGRFppeGxRVUZsTzBOQlEyWXNlVUpCUVhsQ08wTkJRM3BDTEZkQlFWYzdRVUZEV2pzN1FVRkZRVHREUVVORExGZEJRVmM3UTBGRFdDdzRRa0ZCT0VJN08wRkJSUzlDT3p0QlFVVkJPME5CUTBNc1YwRkJWenREUVVOWUxHVkJRV1U3UVVGRGFFSTdPMEZCUlVFN1EwRkRReXdyUTBGQkswTTdRVUZEYUVRN08wRkJSVUVzUzBGQlN6czdRVUZGVERzN1JVRkZSVHRCUVVOR0xHZENRVUZuUWp0QlFVTm9RanREUVVORExGVkJRVlU3UTBGRFZpeFhRVUZYTzBOQlExZ3NWMEZCVnp0QlFVTmFPMEZCUTBFc1MwRkJTenM3TzBGQlIwdzdPMFZCUlVVN1FVRkRSanREUVVORExGbEJRVms3UTBGRFdpeHRRa0ZCYlVJN1EwRkRia0lzYTBKQlFXdENPME5CUTJ4Q0xGZEJRVmM3UTBGRFdDeGhRVUZoTzBOQlEySXNXVUZCV1R0RFFVTmFMR2RDUVVGblFqdERRVU5vUWl4blFrRkJaMEk3UTBGRGFFSXNZMEZCWXp0RFFVTmtMR1ZCUVdVN1EwRkRaaXh4UTBGQmNVTTdRVUZEZEVNN08wRkJSVUU3UTBGRFF5eDVRa0ZCYVVJN1NVRkJha0lzYzBKQlFXbENPMHRCUVdwQ0xIRkNRVUZwUWp0VFFVRnFRaXhwUWtGQmFVSTdRVUZEYkVJN08wRkJSVUU3UTBGRFF5eG5Ra0ZCWjBJN1EwRkRhRUlzVjBGQlZ6dERRVU5ZTEdkQ1FVRm5RanREUVVOb1FpeHJRa0ZCYTBJN1EwRkRiRUlzSzBOQlFTdERPMEZCUTJoRU96dEJRVVZCTzBOQlEwTXNZVUZCWVR0RFFVTmlMR0ZCUVdFN1FVRkRaRHM3UVVGRlFUdERRVU5ETEZWQlFWVTdRMEZEVml4WFFVRlhPME5CUTFnc1dVRkJXVHREUVVOYUxGZEJRVmM3UTBGRFdDeHhRMEZCY1VNN1EwRkRja01zWjBKQlFXZENPMEZCUTJwQ096dEJRVVZCTzBOQlEwTXNhVU5CUVhsQ08xTkJRWHBDTEhsQ1FVRjVRanREUVVONlFpeG5RMEZCZDBJN1UwRkJlRUlzZDBKQlFYZENPME5CUTNoQ0xIRkRRVUUyUWp0VFFVRTNRaXcyUWtGQk5rSTdRMEZETjBJc05rSkJRWEZDTzFOQlFYSkNMSEZDUVVGeFFqdEJRVU4wUWpzN1FVRkZRVHREUVVORExIbENRVUY1UWp0RFFVTjZRaXhyUWtGQmEwSTdRMEZEYkVJc1dVRkJXVHREUVVOYUxHVkJRV1U3UTBGRFppeFpRVUZaTzBOQlExb3NaVUZCWlR0RFFVTm1MR1ZCUVdVN1EwRkRaaXhyUWtGQmEwSTdRMEZEYkVJc2EwSkJRV3RDTzBOQlEyeENMR2RDUVVGblFqdEJRVU5xUWpzN1FVRkZRVHREUVVORExHRkJRV0U3UVVGRFpEczdRVUZGUVR0RFFVTkRMR0ZCUVdFN1EwRkRZaXhWUVVGVk8wRkJRMWc3TzBGQlJVRTdRMEZEUXl4aFFVRmhPME5CUTJJc1ZVRkJWVHRCUVVOWU96dEJRVVZCTzBOQlEwTXNXVUZCV1R0RFFVTmFMRlZCUVZVN1EwRkRWaXhqUVVGak8wTkJRMlFzZDBKQlFYZENPME5CUTNoQ0xEaENRVUU0UWp0QlFVTXZRanM3TzBGQlIwRTdRMEZEUXl4WFFVRlhPME5CUTFnc1ZVRkJWVHREUVVOV0xGbEJRVms3UTBGRFdpeFhRVUZYT3p0QlFVVmFPenRCUVVWQk96dERRVVZETEZWQlFWVTdRMEZEVml4dFFrRkJiVUk3UTBGRGJrSXNZVUZCWVR0RFFVTmlMSGRDUVVGM1FqdERRVU40UWl4clFrRkJhMEk3UTBGRGJFSXNUMEZCVHp0RFFVTlFMRkZCUVZFN1EwRkRVaXhWUVVGVk8wTkJRMVlzVTBGQlV6dERRVU5VTEdWQlFXVTdRVUZEYUVJN1FVRkRRVHREUVVORExGTkJRVk03UVVGRFZqdEJRVU5CTzBOQlEwTXNZVUZCWVR0QlFVTmtPMEZCUTBFN1EwRkRReXhSUVVGUk8wTkJRMUlzYTBKQlFXdENPME5CUTJ4Q0xFOUJRVTg3UTBGRFVDeFZRVUZWTzBOQlExWXNVMEZCVXp0RFFVTlVMR1ZCUVdVN1FVRkRhRUk3UVVGRFFUdERRVU5ETEdOQlFXTTdRVUZEWmp0QlFVTkJPME5CUTBNc1kwRkJZenRCUVVObU96dEJRVVZCTzBOQlEwTXNWVUZCVlR0QlFVTllPenRCUVVWQk8wTkJRME1zYTBKQlFXdENPME5CUTJ4Q0xIZENRVUYzUWp0RFFVTjRRaXhQUVVGUE8wRkJRMUk3TzBGQlJVRTdRMEZEUXl4elFrRkJjMEk3UTBGRGRFSXNjVUpCUVhGQ08wTkJRM0pDTEZkQlFWYzdRMEZEV0N4blFrRkJaMEk3UVVGRGFrSTdPMEZCUlVFN1EwRkRReXc0UWtGQk9FSTdRMEZET1VJc2EwSkJRV3RDTzBOQlEyeENMRmRCUVZjN1EwRkRXQ3huUWtGQlowSTdRMEZEYUVJc2EwSkJRV3RDTzBGQlEyNUNPenRCUVVWQk8wTkJRME1zWVVGQllUdERRVU5pTEZkQlFWYzdRVUZEV2pzN1FVRkZRVHREUVVORExHMUNRVUZ0UWp0RFFVTnVRaXhyUWtGQmEwSTdRMEZEYkVJc1dVRkJXVHREUVVOYUxHbENRVUZwUWp0RFFVTnFRaXhsUVVGbE8wRkJRMmhDTzBGQlEwRTdRMEZEUXl4WFFVRlhPMEZCUTFvN096dEJRVWRCTzBOQlEwTTdSVUZEUXl4VlFVRlZPMFZCUTFZc1UwRkJVenRGUVVOVUxGbEJRVms3UlVGRFdpdzJRa0ZCTmtJN1EwRkRPVUk3TzBOQlJVRTdSVUZEUXl4VlFVRlZPMFZCUTFZc1lVRkJZVHRGUVVOaUxGbEJRVms3UlVGRFdpdzJRa0ZCTmtJN1JVRkROMElzWjBOQlFXZERPME5CUTJwRE8wRkJRMFE3T3p0QlFXWkJPME5CUTBNN1JVRkRReXhWUVVGVk8wVkJRMVlzVTBGQlV6dEZRVU5VTEZsQlFWazdSVUZEV2l3MlFrRkJOa0k3UTBGRE9VSTdPME5CUlVFN1JVRkRReXhWUVVGVk8wVkJRMVlzWVVGQllUdEZRVU5pTEZsQlFWazdSVUZEV2l3MlFrRkJOa0k3UlVGRE4wSXNaME5CUVdkRE8wTkJRMnBETzBGQlEwUTdPMEZCUlVFN1EwRkRReXh0UWtGQmJVSTdRVUZEY0VJN08wRkJSVUU3TzBOQlJVTXNlVUpCUVhsQ08wRkJRekZDT3p0QlFVVkJPME5CUTBNc2VVSkJRWGxDTzBGQlF6RkNPenRCUVVWQk8wTkJRME03WVVGRFdUdEJRVU5pTzBGQlEwRTdRMEZEUXl4aFFVRmhPMEZCUTJRN1FVRkRRU3hMUVVGTE96czdRVUZIVER0RFFVTkRMR2xDUVVGcFFqdERRVU5xUWl4VFFVRlRPME5CUTFRc2QwSkJRWGRDTzBGQlEzcENPenRCUVVWQk8wTkJRME1zVTBGQlV6dEJRVU5XSWl3aVptbHNaU0k2SW5OeVl5OWpiMjF3YjI1bGJuUnpMMHBUUlVOaGNIUmphR0V1YzNabGJIUmxJaXdpYzI5MWNtTmxjME52Ym5SbGJuUWlPbHNpWEc0dktpcGNiaW9nUmt4QlZGeHVLaW92WEc0alNsTkZMVU5oY0hSamFHRXVabXhoZENCN1hHNWNkR0poWTJ0bmNtOTFibVE2SUc1dmJtVTdYRzVjZEhCaFpHUnBibWM2SURCd2VEdGNibjFjYmx4dUkwcFRSUzFEWVhCMFkyaGhMbVpzWVhRZ1pHVjBZV2xzY3lCN1hHNWNkR0p2ZUMxemFHRmtiM2M2SURCd2VDQXdjSGdnTUhCNElEUndlQ0J5WjJKaEtEQXNJREFzSURBc0lEQXVNRFlwTzF4dWZWeHVYRzR2S2lvcUtpOWNibHh1WEc0dktpcGNiaW9nVTAxQlRFeGNiaW9xTDF4dUkwcFRSUzFEWVhCMFkyaGhMbE1nZTF4dVhIUmliM0prWlhJdGNtRmthWFZ6T2lBMmNIZzdYRzVjZEhCaFpHUnBibWM2SURod2VEdGNibHgwYldGeVoybHVPaUExY0hnN1hHNWNkR1p2Ym5RdGMybDZaVG9nTVRGd2VEdGNibjFjYmx4dUkwcFRSUzFEWVhCMFkyaGhMbE1nSTBwVFJTMXBibkIxZENCN1hHNWNkR2hsYVdkb2REb2dNakJ3ZUR0Y2JseDBiV2x1TFhkcFpIUm9PaUF5TUhCNE8xeHVYSFJtYjI1MExYTnBlbVU2SURFMWNIZzdYRzVjZEdKdmNtUmxjam9nYzI5c2FXUWdNWEI0SUNORU0wUTRSRVE3WEc1Y2RIQmhaR1JwYm1jNklESndlRHRjYmx4MGJXRnlaMmx1T2lBMmNIZzdYRzU5WEc1Y2JpTktVMFV0UTJGd2RHTm9ZUzVUSUNOS1UwVXRZbkpoYm1RZ2UxeHVYSFIzYVdSMGFEb2dNekJ3ZUR0Y2JseDBZbTl5WkdWeUxXeGxablE2SUhOdmJHbGtJREp3ZUNBalJqbEdPVVk1TzF4dWZWeHVYRzRqU2xORkxVTmhjSFJqYUdFdVV5QWpTbE5GTFdKeVlXNWtJSE4yWnlCN1hHNWNkSGRwWkhSb09pQXlOSEI0TzF4dWZWeHVYRzRqU2xORkxVTmhjSFJqYUdFdVV5NW1iR0YwSUdSbGRHRnBiSE1nZTF4dVhIUmliM2d0YzJoaFpHOTNPaUF3Y0hnZ01IQjRJREJ3ZUNBeWNIZ2djbWRpWVNnd0xDQXdMQ0F3TENBd0xqQTJLVHRjYm4xY2JseHVMeW9xS2lvdlhHNWNiaThxS2x4dUtpQk5SVVJKVlUxY2Jpb3FMMXh1STBwVFJTMURZWEIwWTJoaExrMGdlMXh1WEhSaWIzSmtaWEl0Y21Ga2FYVnpPaUEyY0hnN1hHNWNkSEJoWkdScGJtYzZJRGh3ZUR0Y2JseDBiV0Z5WjJsdU9pQTFjSGc3WEc1Y2RHWnZiblF0YzJsNlpUb2dNVFp3ZUR0Y2JuMWNibHh1STBwVFJTMURZWEIwWTJoaExrMGdJMHBUUlMxcGJuQjFkQ0I3WEc1Y2RHaGxhV2RvZERvZ016QndlRHRjYmx4MGJXbHVMWGRwWkhSb09pQXpNSEI0TzF4dVhIUm1iMjUwTFhOcGVtVTZJREl5Y0hnN1hHNWNkR0p2Y21SbGNqb2djMjlzYVdRZ01uQjRJQ05FTTBRNFJFUTdYRzVjZEcxaGNtZHBiam9nT0hCNE8xeHVmVnh1WEc0alNsTkZMVU5oY0hSamFHRXVUU0FqU2xORkxXSnlZVzVrSUh0Y2JseDBkMmxrZEdnNklETTRjSGc3WEc1Y2RHSnZjbVJsY2kxc1pXWjBPaUJ6YjJ4cFpDQXljSGdnSTBZNVJqbEdPVHRjYmx4dWZWeHVYRzRqU2xORkxVTmhjSFJqYUdFdVRTQWpTbE5GTFdKeVlXNWtJSE4yWnlCN1hHNWNkSGRwWkhSb09pQXpOSEI0TzF4dVhIUnRZWEpuYVc0dGRHOXdPaUEwY0hnN1hHNTlYRzVjYmlOS1UwVXRRMkZ3ZEdOb1lTNU5MbVpzWVhRZ1pHVjBZV2xzY3lCN1hHNWNkR0p2ZUMxemFHRmtiM2M2SURCd2VDQXdjSGdnTUhCNElESndlQ0J5WjJKaEtEQXNJREFzSURBc0lEQXVNRFlwTzF4dWZWeHVYRzR2S2lvcUtpOWNibHh1THlvcVhHNHFJRXhCVWtkRlhHNHFLaTljYmlOS1UwVXRRMkZ3ZEdOb1lTNU1JSHQ5WEc0NloyeHZZbUZzS0NOS1UwVXRRMkZ3ZEdOb1lTNU1JR2x1Y0hWMEkyTmhjSFJqYUdGRGFHVmpheWtnZTF4dVhIUjNhV1IwYURvek1IQjRPMXh1WEhSb1pXbG5hSFE2TXpCd2VEdGNibHgwYldGeVoybHVPakV3Y0hnN1hHNTlYRzR2S2lvcUtpOWNibHh1WEc0dktpcGNiaW9nUWtGVFJWeHVLaW92WEc0alNsTkZMVU5oY0hSamFHRWdlMXh1WEhSa2FYTndiR0Y1T201dmJtVTdYRzVjZEdKaFkydG5jbTkxYm1RNklDTkdNa1k0UmtZN1hHNWNkR0p2Y21SbGNpMXlZV1JwZFhNNklEWndlRHRjYmx4MFkyeGxZWEk2SUdKdmRHZzdYRzVjZEhCaFpHUnBibWM2SURFemNIZzdYRzVjZEcxaGNtZHBiam9nTVRCd2VEdGNibHgwYldsdUxYZHBaSFJvT2lBeU1EQndlRHRjYmx4MGJXRjRMWGRwWkhSb09pQXpNVFJ3ZUR0Y2JseDBZMjlzYjNJNklDTTNNRGN3TnpBN1hHNWNkR1p2Ym5RdGMybDZaVG9nTWpCd2VEdGNibHgwWm05dWRDMW1ZVzFwYkhrNklDZE5iMjUwYzJWeWNtRjBKeXdnYzJGdWN5MXpaWEpwWmp0Y2JuMWNibHh1STBwVFJTMURZWEIwWTJoaElDb2dlMXh1WEhSMWMyVnlMWE5sYkdWamREb2dibTl1WlR0Y2JuMWNibHh1STBwVFJTMURZWEIwWTJoaElHUmxkR0ZwYkhNZ2UxeHVYSFJ2ZG1WeVpteHZkem9nYUdsa1pHVnVPMXh1WEhSdFlYSm5hVzQ2SURCd2VEdGNibHgwWW1GamEyZHliM1Z1WkRvZ0kyWm1aanRjYmx4MFltOXlaR1Z5TFhKaFpHbDFjem9nTkhCNE8xeHVYSFJpYjNndGMyaGhaRzkzT2lBd2NIZ2dNM0I0SURad2VDQXdjSGdnY21kaVlTZ3dMQ0F3TENBd0xDQXdMakV5S1R0Y2JuMWNibHh1STBwVFJTMURZWEIwWTJoaElHUmxkR0ZwYkhNZ2MzVnRiV0Z5ZVNCN1hHNWNkR1JwYzNCc1lYazZJR1pzWlhnN1hHNWNkRzkxZEd4cGJtVTZJRzV2Ym1VN1hHNTlYRzVjYmlOS1UwVXRRMkZ3ZEdOb1lTQmtaWFJoYVd4eklDTktVMFV0UTJGd2RHTm9ZVVJwYzNCc1lYa2dlMXh1WEhSdmNHRmphWFI1T2lBd08xeHVYSFJ0WVhKbmFXNDZJREJ3ZUR0Y2JseDBjR0ZrWkdsdVp6b2dNSEI0TzF4dVhIUm9aV2xuYUhRNklEQndlRHRjYmx4MGRISmhibk5wZEdsdmJqb2diM0JoWTJsMGVTQXdMakp6TENCb1pXbG5hSFFnTUM0MGN6dGNibHgwWW1GamEyZHliM1Z1WkRvZ0kyWm1aanRjYm4xY2JseHVJMHBUUlMxRFlYQjBZMmhoSUdSbGRHRnBiSE11WTJGd2RHTm9ZVkJoYm1Wc1cyOXdaVzVkSUNOS1UwVXRRMkZ3ZEdOb1lVUnBjM0JzWVhrZ2UxeHVYSFJoYm1sdFlYUnBiMjR0Ym1GdFpUb2djMnhwWkdWRWIzZHVPMXh1WEhSaGJtbHRZWFJwYjI0dFpIVnlZWFJwYjI0NklEQXVNM003WEc1Y2RHRnVhVzFoZEdsdmJpMW1hV3hzTFcxdlpHVTZJR1p2Y25kaGNtUnpPMXh1WEhSaGJtbHRZWFJwYjI0dFpHVnNZWGs2SURBdU0zTTdYRzU5WEc1Y2JpTktVMFV0UTJGd2RHTm9ZU0FqU2xORkxXbHVjSFYwSUh0Y2JseDBZbTl5WkdWeU9pQnpiMnhwWkNBMGNIZ2dJMFF6UkRoRVJEdGNibHgwWW05eVpHVnlMWEpoWkdsMWN6b2dOSEI0TzF4dVhIUnRZWEpuYVc0NklERXdjSGc3WEc1Y2RHMXBiaTEzYVdSMGFEb2dOREJ3ZUR0Y2JseDBhR1ZwWjJoME9pQTBNSEI0TzF4dVhIUmpkWEp6YjNJNklIQnZhVzUwWlhJN1hHNWNkR1p2Ym5RdGMybDZaVG9nTWpod2VEdGNibHgwZEdWNGRDMWhiR2xuYmpvZ1kyVnVkR1Z5TzF4dVhIUndiM05wZEdsdmJqb2djbVZzWVhScGRtVTdYRzVjZEc5MlpYSm1iRzkzT2lCb2FXUmtaVzQ3WEc1OVhHNWNiaU5LVTBVdFEyRndkR05vWVNCa1pYUmhhV3h6UG5OMWJXMWhjbms2T2kxM1pXSnJhWFF0WkdWMFlXbHNjeTF0WVhKclpYSWdlMXh1WEhSa2FYTndiR0Y1T2lCdWIyNWxPMXh1ZlZ4dVhHNGpTbE5GTFVOaGNIUmphR0VnWkdWMFlXbHNjeUFqU2xORkxXbHVjSFYwT21odmRtVnlPbUpsWm05eVpTQjdYRzVjZEdOdmJuUmxiblE2SUNmd242U1dKenRjYmx4MGIzQmhZMmwwZVRvZ01UdGNibjFjYmx4dUkwcFRSUzFEWVhCMFkyaGhMbk4xWTJObGMzTWdaR1YwWVdsc2N5QWpTbE5GTFdsdWNIVjBPbUpsWm05eVpTQjdYRzVjZEdOdmJuUmxiblE2SUNmd241aUpKenRjYmx4MGIzQmhZMmwwZVRvZ01UdGNibjFjYmx4dUkwcFRSUzFEWVhCMFkyaGhMbk4xWTJObGMzTWdaR1YwWVdsc2N5QWpTbE5GTFdsdWNIVjBPbUZtZEdWeUlIdGNibHgwWTI5dWRHVnVkRG9nSitLY2xDYzdYRzVjZEc5d1lXTnBkSGs2SURFN1hHNWNkR052Ykc5eU9pQWpNalpCUlRZd08xeHVYSFJ3WVdSa2FXNW5PaUF3Y0hnZ05IQjRJREJ3ZUNBMWNIZzdYRzVjZEdKdmNtUmxjaTFzWldaME9pQnpiMnhwWkNBeWNIZ2dJMFF6UkRoRVJEdGNibjFjYmx4dVhHNGpTbE5GTFVOaGNIUmphR0V1YzNWalkyVnpjeUJrWlhSaGFXeHpMbU5oY0hSamFHRlFZVzVsYkZ0dmNHVnVYU0FqU2xORkxXbHVjSFYwT21GbWRHVnlJSHRjYmx4MFkyOXVkR1Z1ZERvZ0p5YzdYRzVjZEc5d1lXTnBkSGs2SURBN1hHNWNkSEJoWkdScGJtYzZJREJ3ZUR0Y2JseDBZbTl5WkdWeU9pQXdjSGc3WEc1Y2RGeHVmVnh1WEc0alNsTkZMVU5oY0hSamFHRWdaR1YwWVdsc2N5QWpTbE5GTFdsdWNIVjBPbUpsWm05eVpTeGNiaU5LVTBVdFEyRndkR05vWVNCa1pYUmhhV3h6TG1OaGNIUmphR0ZRWVc1bGJGdHZjR1Z1WFNBalNsTkZMV2x1Y0hWME9tSmxabTl5WlNCN1hHNWNkRzl3WVdOcGRIazZJREE3WEc1Y2RDOHFabTl1ZEMxemFYcGxPaUF5T0hCNE95b3ZYRzVjZEdOdmJuUmxiblE2SUNmd242U1dKenRjYmx4MGRISmhibk5wZEdsdmJqb2diM0JoWTJsMGVTQXdMakp6TzF4dVhIUndiM05wZEdsdmJqb2dZV0p6YjJ4MWRHVTdYRzVjZEhSdmNEb3djSGc3WEc1Y2RHeGxablE2TUhCNE8xeHVYSFJpYjNSMGIyMDZNSEI0TzF4dVhIUnlhV2RvZERvd2NIZzdYRzVjZEdKaFkydG5jbTkxYm1RNkkyWm1aanRjYm4xY2JpTktVMFV0UTJGd2RHTm9ZUzV6ZFdOalpYTnpJR1JsZEdGcGJITXVZMkZ3ZEdOb1lWQmhibVZzSUNOS1UwVXRhVzV3ZFhRNlltVm1iM0psSUh0Y2JseDBjbWxuYUhRNk5UQWxPMXh1ZlZ4dUkwcFRSUzFEWVhCMFkyaGhMbk4xWTJObGMzTWdaR1YwWVdsc2N5NWpZWEIwWTJoaFVHRnVaV3hiYjNCbGJsMGdJMHBUUlMxcGJuQjFkRHBoWm5SbGNpQjdYRzVjZEdScGMzQnNZWGs2SUc1dmJtVTdYRzU5WEc0alNsTkZMVU5oY0hSamFHRXVjM1ZqWTJWemN5QmtaWFJoYVd4ekxtTmhjSFJqYUdGUVlXNWxiQ0FqU2xORkxXbHVjSFYwT21GbWRHVnlJSHRjYmx4MGJHVm1kRG8xTUNVN1hHNWNkSEJ2YzJsMGFXOXVPaUJoWW5OdmJIVjBaVHRjYmx4MGRHOXdPakJ3ZUR0Y2JseDBZbTkwZEc5dE9qQndlRHRjYmx4MGNtbG5hSFE2TUhCNE8xeHVYSFJpWVdOclozSnZkVzVrT2lObVptWTdYRzU5WEc0alNsTkZMVU5oY0hSamFHRXVjM1ZqWTJWemN5QWpTbE5GTFdsdWNIVjBJSHRjYmx4MGJXbHVMWGRwWkhSb09qVXljSGc3WEc1OVhHNGpTbE5GTFVOaGNIUmphR0V1YzNWalkyVnpjeUJrWlhSaGFXeHpMbU5oY0hSamFHRlFZVzVsYkZ0dmNHVnVYU0FqU2xORkxXbHVjSFYwSUh0Y2JseDBiV2x1TFhkcFpIUm9Pakl3Y0hnN1hHNTlYRzVjYmlOS1UwVXRRMkZ3ZEdOb1lTQmtaWFJoYVd4ekxtTmhjSFJqYUdGUVlXNWxiRnR2Y0dWdVhTQWpTbE5GTFdsdWNIVjBPbUpsWm05eVpTQjdYRzVjZEc5d1lXTnBkSGs2SURFN1hHNTlYRzVjYmlOS1UwVXRRMkZ3ZEdOb1lTQWpTbE5GTFcxelp5QjdYRzVjZEdGc2FXZHVMWE5sYkdZNklHTmxiblJsY2p0Y2JseDBjR0ZrWkdsdVp6b2dNSEI0SURCd2VDQXdjSGdnTkhCNE8xeHVYSFJtYkdWNE9pQXhPMXh1ZlZ4dVhHNGpTbE5GTFVOaGNIUmphR0VnSTBwVFJTMXRjMmNnY0NCN1hHNWNkSFpsY25ScFkyRnNMV0ZzYVdkdU9pQmliM1IwYjIwN1hHNWNkR1JwYzNCc1lYazZJR2x1YkdsdVpTMWliRzlqYXp0Y2JseDBiV0Z5WjJsdU9pQXdjSGc3WEc1Y2RHeHBibVV0YUdWcFoyaDBPaUF4TGpJN1hHNTlYRzVjYmlOS1UwVXRRMkZ3ZEdOb1lTQWpTbE5GTFdKeVlXNWtJSHRjYmx4MFltOXlaR1Z5TFd4bFpuUTZJSE52Ykdsa0lETndlQ0FqUmpsR09VWTVPMXh1WEhSaGJHbG5iaTF6Wld4bU9pQmpaVzUwWlhJN1hHNWNkSGRwWkhSb09pQTJNSEI0TzF4dVhIUndZV1JrYVc1bk9pQXdjSGdnTkhCNE8xeHVYSFIwWlhoMExXRnNhV2R1T2lCalpXNTBaWEk3WEc1OVhHNWNiaU5LVTBVdFEyRndkR05vWVNBalNsTkZMV0p5WVc1a0lITjJaeUI3WEc1Y2RHWnBiR3c2SUNNMU1VSkdSVU03WEc1Y2RIZHBaSFJvT2lBME9IQjRPMXh1ZlZ4dVhHNGpTbE5GTFVOaGNIUmphR0VnSTBwVFJTMURZWEIwWTJoaFJHbHpjR3hoZVNBalNsTkZMV05oY0hSamFHRXRaMkZ0WlMxamIyNTBZV2x1WlhJZ2UxeHVYSFJpWVdOclozSnZkVzVrT2lBalJqSkdPRVpHTzF4dVhIUmliM0prWlhJdGNtRmthWFZ6T2lBMmNIZzdYRzVjZEdobGFXZG9kRG9nTVRBd0pUdGNibHgwY0c5emFYUnBiMjQ2Y21Wc1lYUnBkbVU3WEc1Y2RHOTJaWEptYkc5M09taHBaR1JsYmp0Y2JuMWNiaU5LVTBVdFEyRndkR05vWVNBalNsTkZMVU5oY0hSamFHRkVhWE53YkdGNUlDTktVMFV0WTJGd2RHTm9ZUzFuWVcxbElIdGNibHgwYUdWcFoyaDBPakV3TUNVN1hHNTlYRzVjYmx4dVFHdGxlV1p5WVcxbGN5QnpiR2xrWlVSdmQyNGdlMXh1WEhSbWNtOXRJSHRjYmx4MFhIUnZjR0ZqYVhSNU9pQXdPMXh1WEhSY2RHaGxhV2RvZERvZ01EdGNibHgwWEhSd1lXUmthVzVuT2lBNGNIZzdYRzVjZEZ4MFltOXlaR1Z5TFhSdmNEb2djMjlzYVdRZ05IQjRJQ05HT1VZNVJqazdYRzVjZEgxY2JseHVYSFIwYnlCN1hHNWNkRngwYjNCaFkybDBlVG9nTVR0Y2JseDBYSFJvWldsbmFIUTZJREU1TUhCNE8xeHVYSFJjZEhCaFpHUnBibWM2SURod2VEdGNibHgwWEhSaWIzSmtaWEl0ZEc5d09pQnpiMnhwWkNBMGNIZ2dJMFk1UmpsR09UdGNibHgwWEhRdkttaGxhV2RvZERvZ2RtRnlLQzB0WTI5dWRHVnVkRWhsYVdkb2RDazdLaTljYmx4MGZWeHVmVnh1WEc0alNsTkZMVU5oY0hSamFHRWdaR1YwWVdsc2N5QWpTbE5GTFcxelp6NXdPbUZtZEdWeUlIdGNibHgwWTI5dWRHVnVkRG9nSjBsdElHaDFiV0Z1Snp0Y2JuMWNibHh1STBwVFJTMURZWEIwWTJoaElHUmxkR0ZwYkhNdVkyRndkR05vWVZCaGJtVnNXMjl3Wlc1ZElDTktVMFV0YlhOblBuQTZZV1owWlhJc1hHNGpTbE5GTFVOaGNIUmphR0V1YzNWalkyVnpjeUJrWlhSaGFXeHpMbU5oY0hSamFHRlFZVzVsYkZ0dmNHVnVYU0FqU2xORkxXMXpaejV3T21GbWRHVnlJSHRjYmx4MFkyOXVkR1Z1ZERvZ0owbHRJRzV2ZENCaElISnZZbTkwSnp0Y2JuMWNibHh1STBwVFJTMURZWEIwWTJoaExuTjFZMk5sYzNNZ1pHVjBZV2xzY3lBalNsTkZMVzF6Wno1d09tRm1kR1Z5SUh0Y2JseDBZMjl1ZEdWdWREb2dKMVpsY21sbWFXVmtJR2gxYldGdUp6dGNibjFjYmx4dUkwcFRSUzFwYm5CMWRDQnBibkIxZEZ0MGVYQmxQVndpWTJobFkydGliM2hjSWwwZ2UxeHVYSFF2S25CdmMybDBhVzl1T2lCaFluTnZiSFYwWlR0Y2JseDBkRzl3T2lBdE5UQndlRHNxTDF4dWZWeHVJMHBUUlMxRFlYQjBZMmhoTG1GamRHbDJaU0I3WEc1Y2RHUnBjM0JzWVhrNllteHZZMnM3WEc1OVhHNHZLaW9xS2k5Y2JseHVYRzR1WjJaNElIdGNibHgwY0c5emFYUnBiMjQ2WVdKemIyeDFkR1U3WEc1Y2RHOXdZV05wZEhrNk1UdGNibHgwZEhKaGJuTnBkR2x2YmpvZ2IzQmhZMmwwZVNBd0xqWnpPMXh1ZlZ4dVhHNHVaMlo0TG1GamRHbDJaU0I3WEc1Y2RHOXdZV05wZEhrNk1EdGNibjFjYmlKZGZRPT0gKi88L3N0eWxlPiJdLCJu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 */";
    	append(document.head, style);
    }

    // (76:3) {#if open}
    function create_if_block(ctx) {
    	var div, current;

    	var asteroids = new Asteroids({ $$inline: true });
    	asteroids.$on("complete", ctx.callbackFunction);

    	return {
    		c: function create() {
    			div = element("div");
    			asteroids.$$.fragment.c();
    			div.id = "JSE-captcha-game";
    			div.className = "svelte-lngsnr";
    			add_location(div, file$1, 76, 4, 3889);
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
    	var section, details, summary, div0, input, t0, div1, p, t1, div2, svg, g6, path0, path1, path2, g1, g0, path3, g3, g2, path4, g5, g4, path5, t2, div4, div3, section_class_value, current, dispose;

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
    			g6 = svg_element("g");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			g1 = svg_element("g");
    			g0 = svg_element("g");
    			path3 = svg_element("path");
    			g3 = svg_element("g");
    			g2 = svg_element("g");
    			path4 = svg_element("path");
    			g5 = svg_element("g");
    			g4 = svg_element("g");
    			path5 = svg_element("path");
    			t2 = space();
    			div4 = element("div");
    			div3 = element("div");
    			if (if_block) if_block.c();
    			input.id = "captchaCheck";
    			attr(input, "type", "checkbox");
    			input.className = "svelte-lngsnr";
    			add_location(input, file$1, 19, 4, 503);
    			div0.id = "JSE-input";
    			div0.className = "svelte-lngsnr";
    			add_location(div0, file$1, 18, 3, 478);
    			p.className = "svelte-lngsnr";
    			add_location(p, file$1, 25, 4, 668);
    			div1.id = "JSE-msg";
    			div1.className = "svelte-lngsnr";
    			add_location(div1, file$1, 24, 3, 645);
    			attr(path0, "d", "M56.3,556L55.8,704.3C55.9,735.5,72.7,764.5,99.6,780.2L229.3,854.5C256,869.7,289,869.8,316.1,854.7L446.7,779.3C473.6,763.8,490.5,734.9,490.4,703.8L490.9,555.5C490.8,524.3,474,495.3,447.1,479.6L317.4,405.3C290.7,390.1,257.7,390,230.6,405.1L100,480.4C73.1,495.9,56.2,524.8,56.3,556ZM273.3,470L411.9,550.8L411.8,709.9L273.9,789.5L136,710L135.3,549.6L273.3,470Z");
    			attr(path0, "transform", "translate(-55.8,-0.0372215)");
    			set_style(path0, "animation", "a1_t 3.6s linear infinite both");
    			attr(path0, "class", "svelte-lngsnr");
    			add_location(path0, file$1, 35, 6, 1084);
    			attr(path1, "d", "M510.2,556.3L509.7,704.6C509.8,735.8,526.6,764.8,553.5,780.5L683.2,854.8C709.9,870,742.9,870.1,770,855L900.6,779.6C927.5,764.1,944.4,735.2,944.3,704.1L944.8,555.8C944.7,524.6,927.9,495.6,901,479.9L771.3,405.6C744.6,390.4,711.6,390.3,684.5,405.4L553.9,480.8C527.1,496.3,510.2,525.1,510.2,556.3ZM727.2,470.4L865.8,551.2L865.7,710.3L727.8,789.9L590,710.4L589.3,550L727.2,470.4Z");
    			attr(path1, "transform", "translate(-55.8,-0.0372215)");
    			set_style(path1, "animation", "a2_t 3.6s linear infinite both");
    			attr(path1, "class", "svelte-lngsnr");
    			add_location(path1, file$1, 39, 6, 1572);
    			attr(path2, "d", "M283,162.2L282.5,310.5C282.6,341.7,299.4,370.7,326.3,386.4L456,460.7C482.7,475.9,515.7,476,542.8,460.9L673.4,385.5C700.3,370,717.2,341.1,717.1,310L717.6,161.7C717.5,130.5,700.7,101.5,673.8,85.8L544.1,11.5C517.4,-3.7,484.4,-3.8,457.3,11.3L326.7,86.7C299.8,102.2,282.9,131,283,162.2ZM499.9,76.3L638.5,157L638.4,316.1L500.5,395.7L362.7,316.2L362,155.9L499.9,76.3Z");
    			attr(path2, "transform", "translate(-55.8,-0.0372215)");
    			set_style(path2, "animation", "a3_t 3.6s linear infinite both");
    			attr(path2, "class", "svelte-lngsnr");
    			add_location(path2, file$1, 43, 6, 2078);
    			attr(path3, "d", "M585.3,817.8C529.4,832.6,470.5,832.6,414.6,817.7C407,815.7,398,820.2,396.1,828.2C394.3,836.1,398.5,844.5,406.6,846.7C467.5,862.9,532.3,862.9,593.2,846.8C601,844.7,605.8,836.1,603.7,828.3C601.6,820.4,593.2,815.8,585.3,817.8L585.3,817.8Z");
    			attr(path3, "class", "svelte-lngsnr");
    			add_location(path3, file$1, 49, 8, 2633);
    			attr(g0, "class", "svelte-lngsnr");
    			add_location(g0, file$1, 48, 7, 2621);
    			attr(g1, "transform", "translate(-55.8,-0.0372215)");
    			attr(g1, "class", "svelte-lngsnr");
    			add_location(g1, file$1, 47, 6, 2570);
    			attr(path4, "d", "M181.1,413.6C196.2,357.5,225.7,306.7,266.6,265.6C272.3,259.9,272.3,250.1,266.6,244.4C260.9,238.7,251.1,238.6,245.4,244.4C201,289,168.5,344.8,152.2,405.6C150.2,413.2,154.7,422.2,162.7,424.1C170.5,425.9,178.9,421.7,181.1,413.6L181.1,413.6Z");
    			attr(path4, "class", "svelte-lngsnr");
    			add_location(path4, file$1, 55, 8, 2983);
    			attr(g2, "class", "svelte-lngsnr");
    			add_location(g2, file$1, 54, 7, 2971);
    			attr(g3, "transform", "translate(-55.8,-0.0372215)");
    			attr(g3, "class", "svelte-lngsnr");
    			add_location(g3, file$1, 53, 6, 2920);
    			attr(path5, "d", "M733.4,265.5C774.4,306.6,803.8,357.4,818.9,413.5C821,421.3,829.6,426.1,837.4,424C845.3,421.8,850,413.4,847.9,405.5C831.5,344.7,799.1,288.8,754.6,244.2C748.9,238.5,739.1,238.5,733.4,244.2C727.6,250.1,727.6,259.8,733.4,265.5L733.4,265.5Z");
    			attr(path5, "class", "svelte-lngsnr");
    			add_location(path5, file$1, 61, 8, 3335);
    			attr(g4, "class", "svelte-lngsnr");
    			add_location(g4, file$1, 60, 7, 3323);
    			attr(g5, "transform", "translate(-55.8,-0.0372215)");
    			attr(g5, "class", "svelte-lngsnr");
    			add_location(g5, file$1, 59, 6, 3272);
    			attr(g6, "filter", "none");
    			attr(g6, "transform", "translate(498,507) translate(-445.503,-500.996)");
    			set_style(g6, "animation", "a0_t 3.6s linear infinite both");
    			attr(g6, "class", "svelte-lngsnr");
    			add_location(g6, file$1, 33, 5, 943);
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr(svg, "id", "Layer_1");
    			attr(svg, "x", "0px");
    			attr(svg, "y", "0px");
    			attr(svg, "viewBox", "0 0 1000 1000");
    			set_style(svg, "white-space", "preserve-spaces");
    			attr(svg, "class", "svelte-lngsnr");
    			add_location(svg, file$1, 31, 4, 758);
    			div2.id = "JSE-brand";
    			div2.className = "svelte-lngsnr";
    			add_location(div2, file$1, 30, 3, 733);
    			summary.className = "svelte-lngsnr";
    			add_location(summary, file$1, 16, 2, 434);
    			div3.id = "JSE-captcha-game-container";
    			div3.className = "svelte-lngsnr";
    			add_location(div3, file$1, 74, 3, 3768);
    			div4.id = "JSE-CaptchaDisplay";
    			div4.className = "svelte-lngsnr";
    			add_location(div4, file$1, 73, 2, 3735);
    			details.className = "captchaPanel svelte-lngsnr";
    			details.open = true;
    			add_location(details, file$1, 14, 1, 361);
    			section.id = "JSE-Captcha";
    			section.className = section_class_value = "" + ctx.theme + " " + ctx.size + " svelte-lngsnr";
    			toggle_class(section, "active", ctx.showCaptcha);
    			toggle_class(section, "success", ctx.complete);
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
    			append(svg, g6);
    			append(g6, path0);
    			append(g6, path1);
    			append(g6, path2);
    			append(g6, g1);
    			append(g1, g0);
    			append(g0, path3);
    			append(g6, g3);
    			append(g3, g2);
    			append(g2, path4);
    			append(g6, g5);
    			append(g5, g4);
    			append(g4, path5);
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

    			if ((!current || changed.theme || changed.size) && section_class_value !== (section_class_value = "" + ctx.theme + " " + ctx.size + " svelte-lngsnr")) {
    				section.className = section_class_value;
    			}

    			if ((changed.theme || changed.size || changed.showCaptcha)) {
    				toggle_class(section, "active", ctx.showCaptcha);
    			}

    			if ((changed.theme || changed.size || changed.complete)) {
    				toggle_class(section, "success", ctx.complete);
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
    		if (!document.getElementById("svelte-lngsnr-style")) add_css$1();
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
