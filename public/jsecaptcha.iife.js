
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
    	style.id = 'svelte-1er7ldi-style';
    	style.textContent = "#JSE-game.svelte-1er7ldi{height:100%;background:#000;cursor:url('data:image/png;base64,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'), auto}.gfx.svelte-1er7ldi{position:absolute;opacity:1;transition:opacity 0.6s}.gfx.active.svelte-1er7ldi{opacity:0}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXN0ZXJvaWRzLnN2ZWx0ZSIsInNvdXJjZXMiOlsiQXN0ZXJvaWRzLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8IS0tIERPTSBUYWcgTmFtZS0tPlxuPHN2ZWx0ZTpvcHRpb25zIHRhZz1cImpzZS1hc3Rlcm9pZHNcIi8+XG48IS0tIHhET00gVGFnIE5hbWUtLT5cblxuPGRpdiBpZD1cIkpTRS1nYW1lXCIgb246Y2xpY2s9XCJ7Y2FwdGNoYUNsaWNrfVwiIG9uOm1vdXNlbW92ZT1cInttb3ZlU3BhY2VzaGlwfVwiIG9uOnRvdWNobW92ZT1cInttb3ZlU3BhY2VzaGlwfVwiPlxuXHR7I2VhY2ggZ2FtZUVsZW1lbnQgYXMgZWxlLCBpfVxuXHRcdDxpbWcgb246Y2xpY2t8b25jZT1cInsoKSA9PiBzbWFzaChpKX1cIiBjbGFzczphY3RpdmU9XCJ7ZWxlLnNtYXNoZWR9XCIgZHJhZ2dhYmxlPVwie2RyYWdnYWJsZX1cIiBjbGFzcz1cImdmeFwiIHN0eWxlPVwidHJhbnNmb3JtOiByb3RhdGUoe2VsZS5yfWRlZyk7IHRvcDoge2VsZS55fXB4OyBsZWZ0OiB7ZWxlLnh9cHg7XCIgc3JjPVwie2VsZS5zcmN9XCIgYWx0PVwiXCIgLz5cblx0ey9lYWNofVxuPC9kaXY+XG5cblxuPHNjcmlwdD5cblx0aW1wb3J0IHsgb25Nb3VudCwgY3JlYXRlRXZlbnREaXNwYXRjaGVyIH0gZnJvbSAnc3ZlbHRlJztcblxuXHQvL0V2ZW50c1xuXHRjb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpO1xuXG5cdC8vRGF0YSBtb2RlbFxuXHRjb25zdCBtbERhdGEgPSB7IG1vdXNlQ2xpY2tzOjAgfTtcblxuXHQvL0dGWFxuXHRjb25zdCBzcGFjZVNoaXBJY28gPSAnZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFDTUFBQUE4Q0FZQUFBRHNXUU1YQUFBQUhIUkZXSFJUYjJaMGQyRnlaUUJCWkc5aVpTQkdhWEpsZDI5eWEzTWdRMU0yNkx5eWpBQUFDNDlKUkVGVWFON05tWHVRbGZWNXh6L1A3MzNQZmMvZVlCZlljbG1RT0lwVk1RZ3FDZ2g0cWJmcGdJSldGSnltNHpnU3hXQ1RPSjFKSnBOYWF6TjJKbW1UZEVwYm02cXhTVFVHeDBzMEdoQWhLSXBCTGdraUYxMldoUVdXWlhmUDdybThsOS9UUDg3WnM3dmhMS1p4MFo2Wk0yZm0vWjNmODM3ZjcvTjlicjlYVkpYL0x4OHpVb2ErdG5UUnVMOWRkT09FVDJQREhTa3c1eDFvVzlYbCsyT0J1ejVYWmw2OTZmb0pxVnpoZmxzSWxqODhlOTZGbnlzWWUrVEVnMjVvRTZvcWlaN00zM3h1WUo3NnMvbk41UDIvRWdTamlnbURteCtidTJENjV3S21xak43cnhPRUtRVVVBUnM2MHRYMWxjOGN6T08zM1RUS3pRZDNTSDkyRUJCckVOOWYvSjI1YzZaOHBtRHFQajYrMkFtQ2NSZ3BYbEJRb3hqVktqZm4zL1haZ1JFSTI3eTcvYzRRcjh0UzZJWmNqNUR2TnVTNklIY292MHprMXVqL3llUWZtNEgxbzJ2bUhkOXhiTDNSUUVRY2ZKdWpvKzhJUXBFbGk4dW81cm83bXE3WS8rTXpudlJlL25qczBzU2tsSWdBNGhBRUdicE9lQWlDQ0tnVnN1ME5TNWJEajg4b00zZCs2N0hVdGtQaHJrekJOQXVDT0E1ZU5zdlJsbjJJQ0lpZ0tGVng3WnJTR0puMm01K3VPWExHbVBuNEpGZUlvVG1Wc01VbmNzQzFJYWxVV0FaVGxKWFdIczBFMXdQL2NjWUVuTTJITjl2aXpjcGZJOFZmQmwxVFZXeW9pODlZTkYyLzZyRllBSFBRNG8zTGdxNGtjaEZDMVZsemJsODU3b3lBNmZHOTZhcDZ0Z3FJbWpLU1VBMkJtcEtMeW00aVVCM2QybE9ZZFViQStNYk1DY0dJQ21LVXZvSkxwczhsYWdKaVRrQlByME1tNXlKU2hLU3FGSHgvM2hrUnNCZktYRlZGREhUMnhwZzJycE43cjkzSlJlUDMwOTIxbC9kYlJ2RzlGMmV3YmU5WTZxbzlyRlY4Wk82SU03UHM2NCttckxWZkZBTzlXWmVMSmg3bjJiOStrVVd6b1NOeUs3MjFYMmJKZ25wZSsvWUx6RHYvRUNkN1hVUVVVYzZadGV6K3lTTUtabStmWGhncVk2MFZvcEdBUjVadXhvMmZ4LzBiVjdGazB3V3NlSGNCRDIzN0YvellWVHoycFRlb1N4VUlyRU9vcEk3MTVtZU9LQmdieW9XQWt5MDRUR3M2d1FXVE12eGt6N1U4MlhxTWJqMUdaM2lZcHc2MTgvT1dGZnpwUk12TXFVZko1aHhBOGIzZ2doRVdzSndQRUNyVXhUMXdvK3pMUkNuZ2tUUU9DU2VDcHdVTzlNVnhUQTMxVlRtc0JWVUlyWjQ3Z21DZUlsU21vRUxVaFVOZFZRU0ZQSmVNUGtwYWF1a09RakorU0swN2lpL1d0SkR6T3RoL3RBWTNVc3hBZ2VyaytiZXVpbzlJTk4zNDliYTBvczBxU2lJUzhrRjdIYzl2bmNqTjg1K2hMWHMzUHpuWWhESENMVTFIdU9XczcvSHNobkZzTzlCSUtoRVdFNkpLODBlOStWcWcvVk9ENmNtWkdxdGhreUlJbG5nazVKdlBYY3FvNnZXc25QRmQ3anA3SW4zNUZ1cGp1MW4vWGpXcjF5d2tZZ3lHSWhnVnJYUGpkdXlJZ0JHMURhaWtSUlZFaUVjdHVZTExsOVlzNUlicGg3bDQwbTQ2TzdyWXNtOEd6Mjg1aThBNlZDVjgxSmFTdENvYXlnVGcvVThOeHJkMmpCVXBGeUdya0lnRmhLRmg3YmJKL1BlbWNYUzBUZ0FqVkNVRDR0RUF0YVpjdFZRaERIVHNpQWc0Q0d4ZGtaVnkxNG1xWUl3V3kxSFJGNGlBYTRwcmc4dW5GSFhUTUNJQ1ZtTWFOUkFRaFZKemFWWEk1Q0pjT2EyRjY4N2R4Y25PMy9IeXRxbTg4cHVwcEJJV1Yyd1pqZ1VDdFdOR2hCa1JpU01nS3FWQ0xYUmxJOXd6Znp0UDNyZUQyWmRjekx3RlYvUHNOL2J3MEpJdFpQcGNiS25ENmEvZ2lMb2p3a3crMElnaVpUZjFGUnpPRzNlY3IvMTVDMC92dTRkSGYxdEhZQTMzVEwyS2g1YXM1bGZ2dDdKMTMzalNDYi9jNzZpcUdha01MRU1FSFRqTWJHN0hOMmV4NXNOYVBzeTMwT0lkNFBFRDR6akJUSzQ0cDVVd01BT2JSQWd0a1JFQmszZmN2QXh4bTNJeUZ5ZG1NalRHQkd0amhKcWtNU2FrekFsTzlzYkt2WEIvQjJZZDAvc0h1V250ckxrTFRUNnoxRVlUNzNpcDlDK1hibmkxdFgvdHZZVUxSaytjY05ta3RtaTZqRDRWQzlqd3dRUU9ITjdOSTVldEk3MzFjandic3VxOHArazR1cHVYM3J1T2VNd2ZpQ2VGZXI4dy9vbTU4OGN1ZjNOOU9mSDl3NXlybWlJOVhkZVl3TTRSVmVXNUJUYzJ4SSszdisxNDNoUnJCT3U2bmFIcmJrQ2t3MkRIMW1YN3psODcrYUxtWnliUG9NclBvMUlNNFV3dXdsa05YWHhuMmR0TWF3cko5QjNndzRQZHJQcTMyZXhvYWFJNlZVQnRrWjFleCtISzdpUGMxblh3Y0NZUzM0V1lOcU9hdHFFL0Yyc2JVUzB5NHhWNnJveUhRVk0vcmE3djE1c2dXTlNmcmRUM2NXd0lVanBwUUZFcnBCTWVIM1hVY3NmM3IyWHFxSS9vYUhmWjFUcUd2QitqT3VsaHRSUkZHQVNEZzhVR3RnbGJhRUxBRmhORXlhSVV3YmhxemtiRlZTbmRTcVFzUEMzTlFVNFlEQ1M3VWxTcENzbVlEK0t5dmJXSjlvTlpFbkdsT3VGVHpJOERqVG1xUksxRlJBZUZndmF2RGdoWTFZYUlLc01NbDRxUUNQM2lYK1RVUHhsUnF1SSs2VVNBSXhZcmxXTXhWaHB2OUhUUnBJNnpSMUR2ZEVxUEIzN3BHZVNVZU05NUxzZDZvcHpzanREclJTcUdxS0xFYkZoeTgybWlLVXBrdjJENkVKdXFsRnlzUUNMMGNiVElVait4UnFBN0YrVUxqU2Q0WU9GMnVqcDI4OHptTDdDcmRUdzFLWi8rT1Y0QlI0VzRoZ3hMaTViQTlLYmpIZEZ1YzhMNHRyRVNjTVdRQ0R4YzY2T1lVbXFIM3J6TEJVMUgrTkhLUGJUTDVZVGhORmJjOERPV1BlTHoxcDZKcEpNaHF2MWdMSWt3d0E3U1kwVTNaV2RPTzY1R2hqMHBVQkdTZm9HSTJxS2dTNVhQODVWN3I5N0xCOTdWTEhyOUl2NWl3L1VjMFB0NGNORStWSlZRQnlUc29LU3NYMWxQeFlhcENPYnViei9xaTVqVzRjQ0VJaVFDajBUZ0VZcVVxN0JyTEExVnNQTmtQZnV6bmV6UEhlRjNYVTAwVkR1NFRvQzFSWWRhRWFJYWtyUmhLWkFyWVpFQnJha3hId3hYeGxTRWVPQlQ3UlhLV2NFUkliQVJYdDVSeDIxVE52RGdPVWtlT0R2RjRrbFA4c0k3Q1FwZWpJaFRiUE5DaEdRWWtEaU5nRlVHbFFQZmxaMHhoZy90YUJpUTl2TFkwbUN2S05XcGdQLzY5YmswcEhmd3dNeC9wNmQzSDQ4L2EvbW5seTRoblFwTEFoYXNRTkwyZ3htMlJ4a0EwNWV1M2hydHpXZU0yclRLcWN5NDFqS3FrRUZsZ0Q1SExERlhlUFRsaS9uWFg3WnhyTTJodldjVTZVU0lhMnlaQll0UUZ4U0lhRWhlbk1xUEs0NHRXMTcycTFlUHF1UHNySlNTdEhqZVJrTTJ3MkNnQ2hpalZDZDl1cjFxVHVicXFFbjZPSTRkWWtXQitzRERXSzNvSmxHd1JscUdxTVRHb2h1R2x2MUJhd2hqK3JxSjJ1QlVnd0l4eHhKM2d3RUJEUG80S0dPOExGcmhXS20vdktnNGJ3d0ZFNG1zdHlKNnltT3A0anN1OWRiYjdFTFBjT3lkMG9IMXN5ZmthMXkyaGtZcXJtTU0xblZmR3dLbXI2WitreHFuaGQ5RG8wQTJuZjdCblcrdnU4TFZZRitsdENVVmp0UDZjMHhNdFhQekQ1NllIU1pTRDZ0VXNPNll6dWpveGcxRHdOeit5czl6TmhKNVpTakxRaENMdm5ubmUyL2RCMmhNZE0rQXVkTWYyL2E3TTRMZHUyVldzLy9sN1Z1L1lTUFJsMlRRWGxIQU9CdnZmLzJGdzZka2xxQSs5Wi9xT0NxbHVtS04yRUk2K2RXdTB1NklPSnVORHBULzA3dEpFU3lPa1UzbFM3VzFYMVhIZVAwYjFBaldqYTJwMkFOSGw2OSsxeHJuTlMwMVZqWWFlZVdXVFcrK1UxNG4yR0pFZzhIOXBKUTRrRUdBWkdERXdSSFozUC92MVJ2WDdjYUovazlwQ2tRZGQyZFBYZnkxaW1CdVdIR0QrbFZWMzdWTzhlUlNZOG5uQjYrUGRiSy9GYUZkTWZTNk1US1JKRDJSQkpsSWpJd1RJZU5FNkhGY2VrMEVpK0lZa3gxZmw5ZytkQ0IwMWhaUElBMFNTL3pqdDlhdDg0ZWRteFp0ZnVNWEwweS85QmQ0K2V0OGR4REZ3RS8vK2VIc1pmZisvU3BjWnN4djNYbGZ4Q3VreFRqa3ZBSnQzU2ZMckZqalpIZlhqZnVoSDNOM3ZmWDBEOXVHdmh1cTNrSjdWbkhjYmZGNWYvZkVKNzQ3ZU83eUJWT2RYTzlUWG4zanRVdGVmN0g3MU5lMXlkcU5RZk1CNHdkMVJneFpsUDFHS0hlVlJuSVhSKzJGMDNmdDJmdjdXOTg0dU5HOGY5UHFiUnFOcmZ6S3U1czJmZUxjdFBqWDYvYWRtRGpwMW13eW5xMjAvclBhbVpkazNGaE5UeXhKSnBxZ0p4S2pWMXd5VHVscjNNUTZwK2JTU250YnZ2a2t3ZWltV3dZRCtjVHg5aS9YUHRNeTNGb2lsLzhUUjlVSVlGQmNCRmVLQmErL0UzU01NN0hTM2hVL1dtT0J2U1B5SXVQNzB5K1Ziais4SmhzRzlJVUIyVEFnb3dGZDF0SVZoblNIeGQvalFmN3FsYmN2VC82aGR2OFhrQkZ4bzNlNDVnY0FBQUFBU1VWT1JLNUNZSUk9Jztcblx0Y29uc3QgYXN0ZXJvaWRTb3VyY2UgPSAnZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFFWUFBQUE4Q0FZQUFBRGJsOHdqQUFBQUhIUkZXSFJUYjJaMGQyRnlaUUJCWkc5aVpTQkdhWEpsZDI5eWEzTWdRMU0yNkx5eWpBQUFFN05KUkVGVWVOcnRXM2wwblBWMWZhUFpWNDNXMFdvSnl6WWdHNHlOYlFJQkJ4S3lPRFEwUUpNRG9VQkRFNW9tVUpLbXdBRU1ZVEVtMEFJMnNhRWhRRkxPNmVrNVVQQUdGR0pqRzVkZzJjWXNBV3haa2xjdHMwZ3pvOW4zbWQ3N1pPZTBwLzk2RVVSenpoek44czNNNzkzZmUvZmU5NzVQaGtxbElsTzMvMzh6VEFFekJjd1VNRlBBVEFFekJjei91UTBkM091TEo5TGZLcFhMNXcwUER4dStjZG0zZi9CbkRVei9udmU3dzVIWXozTDUvRVZtazZuTllEQllBNEZBT1JaUC9IYkVQM0w3WFV2dmovOVpBYlA2MFh1YVRwczUrK2F5Vk4xbXNsZ3NCa09WNVBONXFmWjZKUmdJU3FGWWtIQTRjbmgwZFBUV0I1WTl2TzV6RDh6dk43emM2SEs3ZjJFMG02K05ST1BWa2ZDWXpKZzVReHgydXd3T0Rjbm9XRVFhR2hva2xZd0RxSUpFSXhHeE81MHZ0clMwM3JIa3Nzc1BmUzZCK1hEM3poOVZ5c1g3ckZhTEw1WE95dUhEUjZSUXlFbGJXNnZNbURGTE1wbTBiTm04V1FIcDZPeVVZaUV2NlhSS2tzbUV0TFpORzdmYmJQZGRmT21TbFo4YllENzVjTmUzOGR2M21NeVcrZVZTVWJ5MWRkTFgxeStSc1ZGSklPanpML2lpVE8rYUlZbDRYUForK3FrTURoNld4c1pHY2JrOWtrcWxKWkdJaWMxbUU1UEpoTWVKSGJIeDZDM1gzL2lqWFo5WllENTRmOWVYVEZXR1g1U0xoVXVzVnF1WUxGWnhPRjFTcVJoazY5Yk5ZcW9TS1pmS2N1NkNCZUx3VktOOFVnSk93VUxMWWpTWnhlZHJsR2g0VklaUllzd2NnbFVCRnhXS3BVb21rM204cCtmZEIzLzU2SXJZWndhWU4vOXIvUVUxdGZWM0dNcWx5ODFtc3pCTGVLdXVxWlA2eGdaSkkwcytSV2Jrc2prQVlCUnZ0VmZxR3hxbFZDcUoyV0pCbHFTa2tNOEpNa01zWnBNWWpTYUp4Y2NsRVl0TE1wR1FodVlXSWRDbFluazRFZ2svY3MrdGYvZjBRQ1JmbkxUQXZQWHFTMmU0NjN6THJWYmJGYmxjVGdxNXJOUTIrTVJzTkNEb29qVDRXcVNxeW9BMEtRdmtXZUlJc2xnc1lXVUdjVHFka2tMSlpOTnBzZHFka3NWblI0WUdKWk5LeUxUTzZXSjNlV1EwRkpKY0pvV1BsOFJtZDRuSDdaSWtRTXhrYzN2aWllVFBydm5lWC85KzBnR3o4dUdsWGZQUHUvQTlCTzhsQ1BGWVZDcGlBRGZZcGE2MkJueFJMVGFIQzVtUWxRb3lvMUFzU29rZnhKSlFGbG8rVktnSVNxZlIxd3dDemdyTUhySkNqeEtqeFFhaUxvb1o5UWUvSThsMFJvWlFZbndmM0lVTU1uTWpIcnI2Mmh1V1RpcGdYbDM3MHRzZzBNVm1wSDQybTBGbUdKSCtTWWxGdzNKbTkyeHA3emdOTzV1VnlHZ0ljRlVnd1M0dG16UXlwSURYMDhpRVpDS3BuRk5iWHk4V2kxbTRYb0tzQUhEcEFLb0lGZXVjUGxQQ1kyUHk1c1pOS0RPamxsVm5lN3RFb21OU1pUS3YrdUZOUDc1bFVnRHp5a3YvOGJYbUp0K2JKbU1WRm1hVnBoYVVERjRQQm9NeUJpRG1MenhQalJ0Vlp6d2FRYmtrbVNoU1Y5ZWdLUk1KaDFGU0JYM040WFNMSGFXVXoyVzA3Q0pqSWZIRDhNRUlhcWJBQzRyVDVRUmdaZG00YVpNd3BFYndWZ1VBMnVHRkhFNitWN3JobW10dmVPR1VBN1BqM2JmZmh2SXNEa2VpMGpYclRLbXJyeE5EdVNJakkwTkM4bVZwV0t3V2tpVmM3WkFTcUJVbFZsTlRJNlFjQnBsQzVoZ0JyQVhLUmU2cGd2cVFqRVBCRVpSYVZvL244bDB1bDVUeHdHNnpTay9QRGhrTlI3UlV5V2MrbncrbGE1VXFveW1PRE92NnpuZXZHVHRsd1BUdStlTjVVSStlVVFUZ2EyNlRodm9HWkkwSlhKSkhpdHZJcXlpdExJaTNTUUVZQ3dYaFpzYzBhSmFUQzZUcUJVQXNxeHdNWG13OEFnQUxBQ2VwSHNaaWN3QXdnOWl0RTJyRkVKZ1pGdkRLZ1FNRDh2R25lelR6SERhekdJRnl0YmNHeEowVHZ6LzQxQzAvL2ZsUFRoa3cyOS9aK3J0RVBIWUREUmlzdm93R0ExSURBK2RyYW9hNjJDVVpUeUJiYkxyVEJrTkZBaVBERWg0TktCRmJVREpHY0ZFMTVOcHNOa29hZ1VjalllVU5nbW16TzhRQjRBd29wSFFxQ1g0cFNCNTNBak1lWTI5cEFNbVBTMjl2cnhwQVp0RzA5bW13QUNiNTQ4Y2ZJd3N6ZjdIMDN2dGZPK25BZlBUaCsrZEdJNk5ic1kwdWo2ZEdjcmswRnUwUVR6VktCTUZSYVZnQ0poQnlNaFpUY05nYzZqMlgxNmFSSE1OeU1wbXRlSjVEb0hGQkg2WHFaYWd5U1d0N0p6aTNMTmtNaUJtZkd4OGZWNU00TXVJWEEveE5TM01Uc3NNdi9YRFNicmRUdkI0WDJ3YzVjUENBOU83cmk3WlA2NWp6L1J0L09ITFNnSG50amQ5VU5kZWY5VkUrbTVsRFlxU0sxTmJXS25sbXNMdmtFWnEzbHRacENBQTdpNER5U0hHdnQxcUpOZzgveG94SXc2ZHNnd3NlSGdsbzZUVzF0TXBwMDd1a0dRR1RwRzNNS3JqZ01HUzhBRUptREFhRFNRTHdORlZWK0YzSU53SHY3KytId21Xa3RiVkZha0QwRVpEOGU3dmZsNmJtMXMxLy8rT2J2M0xTZ05uVnMyMFpKUGx1N3JBVEMyTTVsTUViUVhDTkZYeEJUakVBc0JMTUdDWFhCcTZnR2FQYWRIUjBpc3ZqMVhKNWV2VXEyYkZycDFpUk1WUXVHN2lFcGRmVk5WMjZ1N3VsdWJWTnk0aGxWaTRWVkpxVHFZd1VrVVZWQmdJZW1SaDBEUTVKRk9DYmRUUGFTTUN5Zi84QnJLdWFidnV1NjY3N200ZFBPREFmZjlCemNTeWUzbEpBOTB1Sjd1ZzhEZWFyQUZBQzRvSmNOb0JmVEZoWUhKWStEamRMYitKRStyTWtlT2NPMTRLay8vRHVkbG56eWlzb0k3TktkUW1tcnhuOUVUUEtndGQ0eklVWExWYXlEcU9IY3JyY2FDU05DcFFkbVZsQ1BGRTBvaWs4RDRWR1VXWXhKVzl5WFVNak1nNHRSeDVxMWRyV1hvR016L3ZiSDl6MDBRa0Q1cDB0YjdoeWhmSmV1TTIySW5iZjQvR296UEtyNjdBWWJKVVV3UjBXa0trTGZzT0FYUTJISTBxVTNNVmlJWXNlS1l2SFp0bXlaYXNFNFhQSU5UUjZMcEJxZTBjSFFIVEQ4NEJMYkJaVkt3OTJmZXdvTUc0RXpVenpOYldvdjBuR1l4S0ZzUnNiQzBzRWRzRUF3aXJDSVRPTHpWQ3VDakxXalM2OXZySHh2ejAxRFYrLzd0cHJNaWNFbUExclgzb0JkWDlkUHBNUU81U0ZzbHN1NXFRRGJqUUgzdGpSMDZOUzYzWTVaT0hDQmRJOWU0NGswVFdUaEprdFEwY082V0toNmJKaDNUcm9EUllHcnNpZ1ZPcmhlTHZuekpFVzhNeG9LS0R5bmMrbThiNlIvWkE0SEk0SkNVZXA1ZEFLeEtKUnFhMnJrME1IOWdQSUdESXBqZDdCSk9GSVJNRWtKN25SdFZPeEFINTVYKysrdTE5ZXMrNlh4eDJZdDk1WS8yWDBLMjl4dUpSS0pxWE8xeW91aDAzZEtQdWlQZWlZQThHUVZCQW8reUdud3lwWC9kWFZXSHk5Wms0Y3pqZm9INUp3eUsrRSt2YTJiZkFwVHAyN3NDUzlOYlZ5eHVtejBHMjdoYVBPR0RnamlWSXN3U3ptQ3lVUTlJaVdXQUdnTUhnbjVKbWJFVXZFdGZWZ3Q1NWxQNFZqNkx4ajZOZWFRZjcwTjZGUW9CSUlqVzVhdTNiRDE0NDdNRnMydnI0ZXYvRXROQzB3VVVYMUN4eERXa0dzN0djQ1dIZ0NnRkdlMCttc2ppZm56cDByWDE5eUdhUThEOWM3b2c0MWlkZmprTytEaHc3aCtJdzRVUjVOalEzNkd4NlBXOTFyTy93STV6WnhsQlI5emI3Ky9RREdyMTZHWlpsRmIxV0VwTU5NbzgvSzZ1TUVIVE1BZHpxYzhGTis1UzZDelpLS3dCL0JEWC95ekRQUG5uVmNnWG44a1dVM2VldnFIei8vL0F1Y2RLWWNLSkZiV0VvdWVKZ0kwcG83ek4xaFV6aU9SWEswWUllTVgvU2xpOFdOMU9aSUlaTk9JYWkwRHA1S1dHa01CcENqeS9hMk5raTlRelBMaUl5cmhadTFJa0E2M29Nb2xWMjdQMUJ6bDBNbjdtdHEwdEpoOEFWOEJ6bW5VdUZtQVRUOHBldm11cGlGZE02VWRmNm15V0w5Wk5YcXA0OHZNTXVYUGZCaVgzL2ZkMWl6VjExeGhjb2dQUWdYNVlhaFk2QjVkc240Ry9BSGxHZXFhN3hDZ3U2YU1Vc3pnQ3JDUmRLdEJ2ekRPcEt3MjIzWTdZSTJmMVk4cGdUemRhUEpvZ0FRdEUwYk55S3p3Rk1BeWNyQkZweDFNQkRRTE1paHhPaWJqTWdLamtrSlNod2V4c2J1SFJsRFBxb0NXSmxNcG9MdjNiVnkxVlBuSFZkZ1ZxOWUxZTBmR2RrNE9IaWt4ZW13eTVWWFhnbHA5V21qYUxIYWRiZlpEbkNnelhHREhZVFhDYVBtUnd0Z2dnbHJhUEFwNGRiQUJISTY1eDhlVkNYaWlNSUJFaWZnSEZsZ2tSb2t5WnFONWNqd01CckpnR1lhS2tqY0NKZ1A3Q1JpdkQ4NE9LaVpTVTdTYk1UM3BWbk9BSVNHa1dzbDJlUDlzczFpWGZ2b0V5dXZPdTRjcytLSng1ZUdndjRIbzV5eG5ORXRpeFl1Qkhka0lKZmowZ2t2YzJCL3Y0VEhRdG9jTmtOWjJ0cmFKUkR3U3pROEJybjBhWVBIWVJPOVJoU2x4M1NueGFlOGV0elZrUEFxOWplU0FtYzRBWFFGS3NZSkhrRmdmOFF5elIwdEUwNytNdW1zWmxRVTVVaGw0OGlVcE0vcEg0R2lkYkJhU01RVnRnOUZnUFRNSS8reTRpZkhIWmpYWGwzbkdoNGNITWlrNGo2V1Q5Zk1XVEJsZWV6K2tFenZtcW1wVGorUnc2NXhadUtDNzJEZ0NaUk9BNEN4SWJnWVNKYzlqd3NaUXFKT28wUzRLcFlQaitVMHJ3NkV6c3hKNHpHOUVEbUhvMDltSTYyL1B4QlNUcXNCc1JyeDZRcGJlSU5SUWVMNXFSVCthb1loUTkzd1dTeHZISkh4TmRiL3cvM0xIbm4yaFBpWU5TKy9lSVhaYUhpRlFXZkFEZXlPSTJOQk5WOW5uek5mUjVZY2ZsZGczMG1zSEVMRlFaVGtHTTZCMlZObEVURG51dnhNRG92VytTOEFZdUF1OEF4N0xHWkRBYnRmWFZNakZaQnVGZnF0Z1lFQitjK1gxK3J4UEpYQzcvTkN4YzQ4c3h1YzRvRGk1YlQvSXVldy9Nd29jVzRHNDg0a2swZE1GdlBpWjU3OTdlRVQxaEs4dnVHVjUxdGFXcjRmall5cjhacXc1QUdaTzIrQnpKOS9yaXBER0dEUjhmWVA5S3ZFenB4MWhucWQ4R2hRU25qZTB0NEJlWTJyc1NOcG1pQ3pKT2VHMmhvTm5CbkV3Rm1DL0R6SEZjODg5NXg2SWZJUHZSTjdNeS82cXc2NFpjWkdMakZ6MElWajJEWndZN3dRZ0Ryd1dqQVEvT2ZuZi9mQzdTZTBWM3BvMlRMWEZ4Yk42N1BiN00ySERoK2hkUVdQaEhUZ3pjNjR4dXZXSWZlUkk0TlNMRTNNVDh3V201SXFSNXNzRGNweUh0ekMrbmZBSkJhUWZTeUpjcm1JL3FhZzJVUkFTTW84OXIxZHUyUXJEQ0hkTC8wSis2b2N1SVJ1dVI0OUZUME0rVVJkTVFDbFd0STcyZEJXVEpSaFpzN0tKMWQvZXNLNzY0ZVhQZkM5Yzg0NSs5K1pGY3dhMGFtczZJNUJ1WFF4NUJrdmFyd0d6cGZnMGFqWnNOTkhqaHpXYVJ3ZE1UT0dqV0dwUWpMTnFIMW5SdERwY2o3RE5YdFFKcHpVOWZjUG9EUnNlcDRwcmFOUW80NHplVXdvRk5RT253MGtWWS9Ud29rV2doMTlkdSt2VnY5cjkwa2JWTjE5NSswN1hBNzdvaWk2NkRvRVdRc3k5RUI1eG1ENW1kWTJMS3lsdVJWazJxalp3VE9QUWFoVUFoNkh3eXAybnB5MzFPT3o0N0dJN2pKbk9xbDBEbVVRbjVqaTZaekhLNGNPRDhwQWY1K3FEYnR2OWwxdWp4Y2xPa3Y2K3ZhaHN3OUpjM016V2hTSEFtTUFhRlN6Skw0SFpQelk2bDgvOTA4bkRaaC8vT2t0aTlIOXZnMWUxQm1zRy9WZWpiNkhjc3dhcjRlNmNEYkNscUVWemphSGhwQU5Id09lYUFhdE9ycGtkaDA2T0NEeDhaaG1XVFVDTHFBLzRpaWptTS9wYi9IVUMrZkZMTkZVT3FsZGZSdDRLaGdhbGQ2OWU3U0VQTlg0TG80NEFRaHZFd1NkeFdjekZ6eXg4cW50SjNYbXUvVHVPemVYU3NWTFBBQ2tDRFZ5STBpRFRQeE9jMHVMN3JEVENRTUllOCtYUjBjREVvMUVkZEgwT3lad0Q5TTlGQmpXMHVCWWdkeFFMdXVTaFhOUDhzY0JBRW81bnpadG1wWWpiUXI3cklEZnI4TXJLMmZPQUlSbkkraGZiQVFkejlGVkQwNmZmbHJuOVRmY1dENnB3RHovM0s4dlByQi8veFlUTER4ZHB4MDdWOTlRcTN6aFJWbWRPWHUyMnZRaS9BN1BHTktuREI5MXExWklLOTJwQSs2VUpyQUlsV0Y1aFdFWUNRN2JCeHBCcWt3U25vZWtTbk9uZlJCNGlVckc0Smx4bGFQdGhtN0EwWTJoTlFEWFBQelk0eXZ1T2lYbmxaYmR0L1JEOUVaenk1QnBkc1NjaFpoUVh3MTFkU3E3MFZoY002RnJ4Z3h0NXRobEc0eG1kYm5zalNpOVNVZzN6eWZsQVVnTzVVTU80UXkzQ1BVaEtBU1Vqd21LampsVW5zczZrRHAyWTdmdkpNZWdCTGtaNEw2KzlSdGVQd2ZIWms0Sk1Nc2Z2UGVXZkw3d1pBNEV5N0tnYW5BWExSYVQ3SDV2dHd6c1A2QU5IVSt3elQzN2JJR2FTUnBLbG9EUGlFRysyUmw3T0ZEQ2J0UFRaR0g2SW5EUVBJYUdrUm5ERzdPRFdZVUMwK0FKREVtV3o2MUhTNGRadzh5QzJ5M0JYQzdjOXM3MkQwN1ptY2dINzd1M3p1OGYzb051dURHVmhJeWlHVlREaGlCNjkvWHFxVm56MFRMaWZlR0NCVkNpV21TVlVSS3BDY2ZMSU9sektMTjh6blBUSlNYZ3ZKSTFoMWtFbDZYR0RHTDJrSlBvY1FnR3UzMUtQVGVHSFFJQXZYbk5tdldyVC9sSi9WbW56NXk5NUt1WHZveGRPMzBVUVRFQUtrWDVhTXB6TnFLakJZNDRFVlMxdDFxYlQ1NDU0Rm1FUEsrVjRiVTBBQ09HM29xZ1RzeUNKektRSUV4Yy9WQlVJQWdTczRRbFJ5N2hxVjA1bWttNHIxKzdic05mVHByclkrNjU2MDUzV2NvcmhnYUhic3hrVXVvejZIb1p3THl6ejFMNXBrM25rSWs3dS91REQxV2RhTllZb0xwaGdNSGcrSndBTURPTzNTY3VlQ2hybzhqdjVIZno4eE9EcW9vQ1NBRkFscDMreHB1YitpYmRGVlhmWFBLTkphbDA2dWNJNENza1g4NVphQUF2V255aE5QbWE5S0xEZmZBZWIyN2FmRFFnNDU4VWgyRHdSb0Fvd1h5L3JHT0dvZ0pHNGlVZ0xCdG1Hc2NQcWxRRURsemxkbnMyckZtMzRmSkpmUTNlb29VTDVsaHQxdHVzRnN2MTdJKzQ4TGIyZGpWbiszcjN3ZTNHSnM0cGxjdC9Bb2luZHZsY3lmWFlheHhOSWlzSURrdU5SbzZETURXQVBOMEwwa2RmVlFiUC9OdWlMMXg0Ni9MbHl4S2ZpYXMyRnk2WS8xV3Z0L3BKbTlWMlJoRHVsZVJKTWlaUHNCUUlodWtvS0JQRGJ0R01PRlpDUEk0QU1WdW9VZ1NKSlFVQWQrUDV0bUtoZUJESGJOeTU2NzNlejhSVm0vLzdkdjZDZVhhNzIzTS9ETjF0dkR5VkJ1NllxaEFjU2duWHg5TWp4MlNYcGVMU3M0OG1mWThaUWxCaXNkakdmS0d3b3FkbjUrdkhZMjJUNHNyd2E2Nys3aGN6bWV5dmtzbkVQRjdIUW9OM2pEeVpFUVNCZDRLZ1Z0OXEweElFNTRRQTVscjRtT2ZlZlhmN3p1TzVwa256dndSYnRtMDNybnhzK1VPeGVPd09udGNtMFI1VHBXTTMraGYwV1RFMFJWdncvb3Q3OXZTK0RqNkpuWWoxVExyL1B2bnlKUmRmQ3Z1L0twL0x6YUp0QnpCaEFIUVF2TEliZjdlQWMvN3cwVWNmUjA3ME9pYmx2K1VzV3JUZ2ZMUEpmQjhBV2c4ZnNubkhqcDE3VC9ZYXB2N0RiUXFZS1dDbWdKa0M1aFRjL2dmeklOUXVkREIvWXdBQUFBQkpSVTVFcmtKZ2dnPT0nO1xuXHRjb25zdCBhc3Rlcm9pZEZsYW1lID0gJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBRElBQUFBeUNBWUFBQUFlUDRpeEFBQUFISFJGV0hSVGIyWjBkMkZ5WlFCQlpHOWlaU0JHYVhKbGQyOXlhM01nUTFNMjZMeXlqQUFBRW90SlJFRlVhTjdObW5tVVhHV1p4bi92ZCsrdHRidDY3M1NuMHlGYmh5UUVFZ0pFTnNYSUlvdkVBdzVIT0NyT2pBZlVVWFJRUVhGUWNVUUdad1E5T29BeTRqS01vaUxnQVdXUm5TUWFrRUFJVzBnSUNlbnU5RjdkMVYzclhiNTMvcmdsZzdJWUVIVHVPZFducXZxZVU5OXozK1Y1M3VmN1JGVjVNNjVkQlZJTnYvaWZ3N3duSGp2QmZXWndYMFpMSTBHbS9hZk5EMXh6ejR2dm03bnFwOUw0MGRQLzRrWElHd21rK0kwZmR0bDFkNzlkeG5ZY1pSTFZRMDFET044NDVVWnFnZEhKQ0R2a0ZhbTIzV283Kzc3VzhOaDFqd0FVVHo5L051WEM0VHE2KzRuR2piZHQvWnNDaVc2Ky8zQi93OFlMd2swYmoySG5VeW14ZVp4MGhOc01UaGVZRG9Hc290T1c4RW1QY0R4WlZlUDBxMGsvd3BvRlA1S05rYWY1aVhPZGxzWWZwQjY5OTcvLytrQTJER1NxOS8zeU03cnp5WC9XYlErMTJMSG5rVkJSUENSaE1GNkkweHppOVFyU0RxUXNXaFJzQldqeUlXM1Jza1RSZU1jRHdiYlZKVThtRDB5ZTlyYmorTlFYbm5xdFMzRmZMd1o5K0xFamF0dWUvb0dkenZkSmJRclQzWU5OZGhBTVRrT2hERjRHY1FXemN4amRVeUN4cnlLekJab1VwejJFTmg4NkEvQng1Sm14TmZhWmpkaitOb0pOdXk3ejRJVFh1aDdub29zdWVsMUFTZzl2T1NFb0ZIemIzSEJYZU9BUjdVSDNvbllraWFtRlVDMWlhZ1U4eDBmVUVrMkdpQ09ZRGtXYlFpUVRRaUpDc3dvWkE0N0ZTUld4endXRXhZNjJhaVpaU3E1WSt0QmZKU0lOYTQrN0dyZ2FZT3JHR3hleWZzTVNXYmNPUnllUnBoQjNsc1ZwRGxCWENFYzhyQ2ZZMlRXY1pXVlVGS29Dcm9FdVJacENURkl3UVpIcWd6dWJnOTl1V3NFSFRubmh0L3hiNzNhQjFzU0pSNCsrWVVBS2kwN2IzN1V6czl4VFo2YTgza3EyK2tEcng5d25COWM2MVVITUhNVnBTeUpwUlJJZzFpR2FFU1JyY1pyQkVRZEtEcVJEcEZtaEc3UWRtQVpOQXMwUmJ2T3dCQnZ1N2ZtalpoTDREdm54VmRYL3VPeWcxSG1mL3VwZlZPeUZGZTg1ekt2c3V0anJIbiticzJySzFiUkRzQ21OVGxSeGwxUnhsMWdrRFFTQ0dnVUZSaFBvcUFjcGkybFZ5Q2hrQWtqWDBEa1JIQ3JRcXZBY01BS3l6U0c4dTVIcStzNm5xeWVkZEhMN2R5L2Y4VUlxWC9pdjgvR3JEekNUdnlKNzFYY3UvZFAxbVQ4SFlIcmxjYXRLRGN0L25wcmNkRTl5NmE1M3VJZm5YVm9EcVBsNEIwK1NPbk1hNzVBQVNRQmkwWjRxTEt3aXM2cklQaVhNMGdxbVcxRVAxRWFvQ1NFZElTNFFLaVNPaE83M2dRZmtJcVFyeEduTFZNUGVZNlBDRFplM2x5LzUwbjRBWG5QM2dGSDNRbEh2Y3dCVDUxendyc21Mcmszc1ZVUktCeC83OS9ya3M1Y1pMYlltRGdJelQ0bHFndnFDMnhwaTJrTTA3OENBQnpVRFhTRnkxQXk2M0FkZmtGSFFTWVVaRDZrbDBXd0E3VFdrQVVpQ3pnUDIrenJ3UHRpK0VqYVBvT3NicU4yZXV5TzlmZkQ0MGlIdnVGQ0R5bnNhTnYvdVFJQ1pUMXpZQ2ZabWNXdVRraWcrYW5mMER6UmVmK3VWcjFvajB5ZC9ZRCt6ZGZ0WHBWcHVsVjZEUllsMkdHeEZFUXYrOWhUT2pJZnhRVm9EWkhZRWpSR29SUUNkcCtpU0REbytDN1lXa2Z3WWtoTElnS1lCQzR3RE16K0doc2ZBTHlCSjBBQ1lkdmVmU3E0NVB0R3o1eWRxM0s5TXJ6MW1DMjdqS2JrYmI5b3grZlh2ZmlreE1YeTdrM2FQTS81VGp3Tlh2bXBxNmVZbnZ4dFd5dDJSbzVDRGFFWUlkaGpDWncxaHdjRW1EWGFPQTRkYTVKZ0FPWDRhT2FBRWpnTytBMVZnV3BHc2grempRUnVRVXRTVitQRTFBU0xvd0tNd2RDMk1WNkVpU0lQRnBHdXpFM2JYRDYxMFhpTE5Obkw2dC9TSkNUOENrRzdyMk9nMGQvdzZ1bXVUMGFIK0pZVmxSNTc4aWhFcG5mYWhxMnl4ZUpCWVI1emxLY3l5TEpGbW9aVEhoTk80N1Jhdk8wSzZLa2huQkNuUWxFV3lFWGlna2NJTWlGOEZaeHNZMEJSSVJaQTBhRkxBZ2dUQUFKQUg4b0lPT2tpVDRCMFNJc255ckxCLzIzdEpDYzUrcmduR0JsY0FwUDdoMUVMdDh1OTlRYWVEa3lRWVNyakxEN3JVdjNsRDZZOEk4UzVwTUoyUnVkUTc5T0N6dllOWHBiM0Q5aXM2ZlVsSEowZU1qT1Z4S0pIc0VieHVSVnBCR3VOY0p4a2k2UUQxSXZBdGtnZXBDYVFWZGV1UEt4U2tVci9mVWFRR2hCRG5JVWpGZ2FFVWlDQ3VRdWdoY3hSVmhXYkVUbGRhYTlmL2FqejUvZzgrT3ZQQkwwNVRxeldhY09wUWQyRkxtNTF1bVdXS2wzeXpONy9xbUM5TmRTMS8rbUF2T3hyZDlLdlBoSTg5a1didW5Kdk11MDU1Zi9UTW5qMXNHNGZCR1p3RW1GWkYyeFRhTERTRmFLNEtIVlcwTFlRR0lDV29VMStrRmNnWjJOZkFTdEIyUld1S1ZJRUlOQ1hnQ013QVpVQU40anRJUmpHTkVVNmJ3VHZTWXJJaFJ2MFdHZHo1R1lDV2JiOHFPOHVXL3lpS1dyR2xDYUtaMFlUUjV3ZVA5enJhRjNsdlB6eEZjMXRneTlWL3IzN3ptbE5tYm56MjA5SEYvM2kyR1htcUc5K2luZ2RkRnViNzBPMURjdzJhYWtoYkRUcENwQVVrQXpRQ2M0RFpRQXZRWVNGbmtWbUNyRXhEVndLQ2Vzc1VSWHlRb2tDb1NDYitoMXFEdEVRd0xSZ0JkMkVBT1VWTDFjN0tVWWV2QmZDM2J0a1dwcnVlQ0NkU05wemZkTmNydHQvdzg2ZXZrNG4xUjlqcGtrUzdIZHdXZzdNZ1JEb0NGQXZOUHBJTjQ5VElDZHBLSEpFTWtORDQrOWI2eTNZQ0MwRmFvVEFBdTdjZ1V3bzFRY2NWbVphWUxGVmdKQWxUSGxRTnRqK0JEUTJ5TUNCNDFtQ0hUTTBPdDF6YnNHdnJXWk1keXpNSVB5UGx6bW5admZuQWx5MzJ3bWxubnB2Y3NXbUYyMWNTVkhBNndaa1RRRnNJcVFDU0VYUkcwQ0JvT1Y2MENraE9ZekJoWEI4MEFSd05YQVpVUUg4TnVUVFNsNGZCZm5SN25GSnFRUndncDVEMFVWWEVUeUZ0aWhteVJEczlzQlozdmsyRWllb3FBTHVvM1NMcG5VNW54OVFyZHEzZEgvbk8xWDFucno2VG5ZbVZwc05pMmhXU0lJNUZVeEd5TUlMZWV0R1dKZFpKWFhVUUFXQTFqb3cwZ3Ywbk1Dc1FBbENENmp3MExUQzNINllVZGh2RUNrUVdEVUdhTGZnQmxGekV1dEN1bURLb0k1aHNKTjVDdjN0b3p0LzFKTDcxK1dGNWROT1QydEk2eDcveUp3a1hZT3hmTG5FYmMwMlpZSGpLTk83ZVU5ai9oaXRLTlNkUmM2b0dDUzBhQ0l5NnNieVliOUZ1UlR5SmRWVldZTGJGTkhXak9qOEdMRVhRblNpZlJNeXBjZDdqZ2F4R1pEV3FTeUN4SFhvM3crTUdKbDFJMVJCZjBVYUpCV1UyUklNQVdnWFRvcWp2Z0s5SUdPVnlQVStma1QzMXVLL25IWHNkdjd6dHY2YUtwYzQ0SXZQbXVMV3JyL3UrblJoYlUxaDkwSWZ0b2U4NU5qVXh0VC83V3pRSDdISmpudWhXeEl2MUlER0pROVpDSm9keUhLS0hvZElhSzBBbWdEOUljVVdRRjhYOENPQ3owSGdtMmg0Zy9RWXdhTmJHeE5taTZPNFFMVHFZaElGTWdCc1o3R2lDYUZJVGppMGZEdUJjZC8wTWNQSEFIWGZ1Y1FFNnpqcXpPdm0xS3g1aWFPd2tjK2Y5MXp2NUdkeXVBT2xWaUFRZEZhUlp3TE9vRXhlbGVpQ3VvcWJPQXhnZ0FRcEtHdUZ0WUJhamRhcjRJOGt0QUNlaW1UT1JwZGVncFNEdWRvdEFab05PQ2RKcG9SVEZhZHBvd1l2VFRTY3dkbmZRYlI4L3ZhL3BZd00xM3JyKzhWVXZsaWhhOWs5d3dtbFBwc2N3WG9pWkk1QUwwVmtoN0IvQzRnak5SVkFEcWdwU0o3c0NNREdOUnJlRDZVZElBQjRxUFFpcE9naDVxUVFpaC9KMnRCdFlyc2dTa1BtZ0RScExtVTVGMmdLMElVQlRGbTJKK1VTTUdpMGw1L0pRNlF5bWhydGZJdU4xMGNLZDBkSmU2OHcxT0l2QmRDcXFCanlMTEt2QkFTWE1yQkFKUWZJU2E2a3FNR2xpaVJHT29Pd0Q4bFpFVTRqbVgyM2lSd0JoTHVLMFFUTm9xMElDUk91clNvTzJLTkpna1lUR3MwNDZ3cVN0MktyTzltOHJub2ZWMGt1QW1BZCtjVzQ0NzVETjBiUVR1WjBSSkJWSldNZ0ZhTWFIamhyYW9XaGE0M1NwU0J5TnNUcUxPOGNockFGcFJjMWJVSm0zRitOYU83ano0N3BvTlBBSFRuTUVqRUFXYUxmUUdLZXdxdFMxWEJuL044OFVlUGVWejc0RVNBc1VkR3ppRXV1bnlyYmlRTm1CUU9vTTdzTXNDeDB4K1Vsam5GWVN4V3BWWndIdXljRGNlZzNzZzBqWFhuaFJqV0E2NDA1bjVxTXFjU094ZFdMSUFtMmdqWEZoU2MxQVJRQ2lVTkxiNEozVmw1MFFHNis5OGk1MU1sUCtzNG9OYkV4c0NEUlo2QUpwVUdoV3RFMlFObEJYNHgvSjlxQWMrRG84cFF4d0J2Q3BtUG5SV0hPVmdCeElaMTN5R0pBcWFNa2hLaGdVVTlaTTgzKys0cWliWGpTN1NKUzVnTUJNazY2M1ZnL29FYVE1bGgrU3FiL1BBUTBDVFNEZUlNSXVWSG5ScTY1Y2xiaFBhMVR2MjMrNEFqQWVZdFlpY2c0cWkyTnBYNHpsdlRTQ05tbXNHSHpRc3NGT3VvU1RLSGo5YlVPYmJuelZtYjJwOFBDUHBkUGJTb3RWa2hZSmdhU2lpUmY2SnJpZ1NVVWJGVkltdmljNkg3Z0JaQWJrRmxSUEJ0dUR0Ui9CNmxDc1FlVC9paDM4ZWpmTG9kSUYwZ0NXdUJZYUZEeU5nZmtDTlVYeUJqdmtZR2RNMVNaU3QreVZIUlFHcWVlVFVqNlFWT1JoRmNuSGd4RnBSVXVDTmltU2FFZDZLckNuQk9NQ01nRDJ2ZUFKYUJTbllRNUVoc0FrLzRSUE5CYWVHajhiMFNLcWd6RVFEMHdXdEZ4M1pIeUZra0dIdlJoSXpWVERWTXV0ZStXaTZHVG1mcHMzRlp5NHFMVlVuK0xxVm84RWdQMDMxUHNKZUFzZ3I4Z0lNQnpCUUlnTUtUSlZmL0RtSU5EMk9naXQvNDNKVXlSWi8vd2c2Ry9CY1RDTm9DS0lCYWtwRkVHbUJMc2pSVmdBYWs1cFpzR0hmcjlYUUd4Rm0rMU94MmpWMUJjRFlnWDFRUklTRjJSNEM3QVd6T254MDR1SUxaNEFxRWs4Q2JxNStuRHlweHdpQ0E0UW9Bd0QwNGdjQmM0aGdDQTFSY3N4d3pNRmRzd2oyT3BpOCtwcm1McHZ3YU5uVmZZS2lQdVdKU2NHT3lXakl3YUtIbEkxc2MwWnhVbkJETEQ3WnNUL0hOcTFHTFFQM1FGYUV5UWo0TlNsQy9zRGI2bm5WQmlqQlZRajlBL29TU1BNUnVsQ3RDRjJVVXJBdUNCRGNWcEYyMU5FdXd4UzlLWnFMWE11MjN2TGRKOU9EVGNrc2J0OW5ObUtUbGh3UWtRc2txeVBzbU1LNWE4aEM5clJKWWNpa3dKVDIrSnVob0dhaGNnaWpsTVBSRVRzOTR5QnZSVFlnc3BId2ZTZ2NpL1krOUR5RnNnck9pTElzTVlScWJoRWozc3dxWkcyWkI3czNIM3Y1cGRiOHN0R0pQSGhNeTZRK2ZQejRhU2dSYURrd2FpRDdoRVlCN0VLUnBBaThOZzQyTVBRbzY5QjU2K00yM1dMMWcySHpjQk5nRVVsQ2JvUjVYMm9YQTV5RjVnendCNERVMTlHdHYwV0hpdkNkb0YrMEJFSG1zSG1EZlpaUVVtTlZsZXUrdUpyTXJHVFJ4NnhyaEo0M3crSEVoLzM4alpqUFB1Q2V0QlNMTFVsYStPQktnVFplamwwYjBETVRLeUtXeFRKZ0RvVmlMNEZjai9JTk9obXBGcEJyYUN1SUtFUDB6Nk1DRG91c1FOVEJwMTAwRzZMOGNEZWxTS3F0ZFNpMVgyM2ROenpzODJ2MlkxdmZ2NDNueTFrK3BiNVQvc25KQkRIdERqMUJockFEZ09CSUhOcjBCcWgwUVFTM2dxTmdtUUZ5Z29KUVJSVWhzRWJSa0xRcVJpUFVZMDdtQTlNQzFyZ2hRRk9KOTA0b2g3VUxtL0NYOWVCMzlNOHFtdFdYUDY2OTBlS2M5ZDhNdnY0YmZ2cFZIVitlclVpTm9GR2duZ1duVWhBMVlFRlphUTFpb1ZlVWNGS0xPNThSWkoxQVZqSGowOU0reUV3YW1CUGJHUkxnNktlQTZPWm1JT1NaWUtybTZuYzJZem16TFN4cFN0YUxyMzRtYjlvRHpIZnUycTlESXdja2V5cmtWb05wb2w0VHZHQmdodHZvUzB1d1R3Ym05TXU0RXJjNWVydjY1TVhFc1R5WHllQkFZR2lBUytLTjBjcVdVajd5TklaOUhjZTVYOXRwbXBicTk0KzdkL0xiVjEvenArVGJYOTJXOEY0em1icGJxL1d0cWVwYkZUQ0FVRUhQU1F5aUdPeHp5WFJKN0xJb0JQTHFiUkFLclo2eUlPVTY3eFJFclFmZEJRMHEraStGcm9qS0dTZzBJQ3VLQ05uektBbHFQMnNuVnJ2NnAzbXhLUE8zaHNRZXhXUnAwWGNubzZsRDVzMWIxMWhkK3pHS1R5SnlWWndab0czSkVJVTdKU0pIZm5GRmVnTG9DdDJQYVJZWi9JR1FRcEFwT2c4RjFwblErREF3QUNNS2JySUluTXNzc0hCUHljN1VYeTA5OHV0K3NTMzMvRHQ2VUdSeFMybm4zV0hjK3pSVzhJYmJwMlE1KzVacTlWYW04bUFkNERGSkdKMWFtWUZ5S0lTOU1RenVPYnFYbTlBUEVlMEt2UW1RQStBbVFTVUhvUWdnbW1EYmpENE4vVlNhWDduSStINVoxN3BiZG04TEl6c0w5dlArOWk2TjNTZnZYckUybVhCcWhXSnhtOS9aWFA1dmNkKzNKM1plckVkcWpTRnd5NU9oeUlwY05yQVd4UkJWd1Z0cWtFaWRsMklBQ05vcnU0bUZoV3FGcWFUTUpyQWJ2ZndOM25VU2kzWTJXMklhNURaWFErdXUvM25oNThjajFsdjNvR0I4dnVQdVMrWmVPb29MVlR3bjBnUmpjU0dYWEtwa2xnUlFYc1FkNmlheElPNGE4Rll0T0lpQlJkQ1FTc0dXekJFNDBLd1V3bkdJOVJ4Zk5QU2VtM1QrWi8vQk9kOW9QeW1uM3lZN1B2d3djbnNQZGNtang1ZTR2UkdoQStucVQzb1lzY0ZkdzRrbC9oSWU0aTRibXdwV1FWcklLaEw5SW9RVlNBY0VjTGRFSlVTbHNiY09yT3c5OExjNys5WS8xYzl3akVtSng2YU92Q3BxNUx2R2xucExhd2h1eHFJSGs1VDJ4SmhPM0s0QzRSRWNncVRVQkFEVnJBelNqQ3NSQU1PMGJCREZMcFZUYVp2azFtekxtdmVzVzdEMyt4UXpSWjVPcm5QM05NLzZCNVV1OEN4dFhrTVRoTU9SdmdkZlVqZlBOekI1ekJqTzNGYlFWSWVOa2hoQzk2ZWFOeDlJSW9hN3dqbXpiMnRZOU1OSS85dmpqbmwzMDFXbzNOUE5zOXZlYWYwOS9jb3pDV1ZubzlxUW91VnNyanVxRm5RZTdkWnZQU0gvdXh6TnJaOVkxSDRScDRQa3pmcjRGbCs1WkVkcG4vaU5NVXVzTjN0ajlqbEI5elo4ZE9yeG5pVHJ2OEY1RllicU9nV2lpNEFBQUFBU1VWT1JLNUNZSUk9Jztcblx0XG5cdC8vZm9yY2UgZHJhZ2dhYmxlIGZhbHNlXG5cdGNvbnN0IGRyYWdnYWJsZSA9IGZhbHNlO1xuXG5cdC8vVGltZXJcblx0bGV0IHVwZGF0ZSA9IG51bGw7XG5cblx0Ly9nYW1lIGVsZW1lbnRzXG5cdGNvbnN0IGdhbWVFbGVtZW50ID0gW3tcblx0XHRcdHNyYzogc3BhY2VTaGlwSWNvLFxuXHRcdFx0eDogMjAsXG5cdFx0XHR5OiAxMjAsXG5cdFx0XHRyOiA0NSxcblx0XHRcdHR5cGU6ICdzcGFjZVNoaXAnLFxuXHRcdH0se1xuXHRcdFx0c3JjOiBhc3Rlcm9pZFNvdXJjZSxcblx0XHRcdHg6IDIzMCxcblx0XHRcdHk6IDIwLFxuXHRcdFx0cjogMCxcblx0XHRcdHR5cGU6ICdhc3Rlcm9pZCcsXG5cdFx0XHRzbWFzaGVkOiBmYWxzZSxcblx0XHR9LHtcblx0XHRcdHNyYzogYXN0ZXJvaWRTb3VyY2UsXG5cdFx0XHR4OiAyMzAsXG5cdFx0XHR5OiAxMjAsXG5cdFx0XHRyOiAwLFxuXHRcdFx0dHlwZTogJ2FzdGVyb2lkJyxcblx0XHRcdHNtYXNoZWQ6IGZhbHNlLFxuXHRcdH0se1xuXHRcdFx0c3JjOiBhc3Rlcm9pZFNvdXJjZSxcblx0XHRcdHg6IDEzMCxcblx0XHRcdHk6IDcwLFxuXHRcdFx0cjogMCxcblx0XHRcdHR5cGU6ICdhc3Rlcm9pZCcsXG5cdFx0XHRzbWFzaGVkOiBmYWxzZSxcblx0XHR9XTtcblxuXHQvL3NtYXNoIGFuZHJvaWRcblx0Y29uc3Qgc21hc2ggPSAoaSkgPT4ge1xuXHRcdGdhbWVFbGVtZW50W2ldLnNtYXNoZWQgPSB0cnVlO1xuXHRcdGdhbWVFbGVtZW50W2ldLnNyYyA9IGFzdGVyb2lkRmxhbWU7XG5cdFx0XG5cdFx0Y2FwdGNoYUNsaWNrKCk7XG5cblx0XHRpZiAoKGdhbWVFbGVtZW50WzFdLnNtYXNoZWQpICYmIChnYW1lRWxlbWVudFsyXS5zbWFzaGVkKSAmJiAoZ2FtZUVsZW1lbnRbM10uc21hc2hlZCkpIHtcblx0XHRcdGdhbWVDb21wbGV0ZWQoKTtcblx0XHRcdGNsZWFySW50ZXJ2YWwodXBkYXRlKTtcblx0XHR9XG5cdH07XG5cblx0Ly9tb3ZlIHNwYWNlc2hpcFxuXHRjb25zdCBtb3ZlU3BhY2VzaGlwID0gKGUpID0+IHtcblx0XHRjb25zdCByZWN0ID0gZS5jdXJyZW50VGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdGNvbnN0IG1vdXNlWCA9IGUucGFnZVggLSByZWN0LmxlZnQ7XG5cdFx0Y29uc3QgbW91c2VZID0gZS5wYWdlWSAtIHJlY3QudG9wO1xuXG5cdFx0Z2FtZUVsZW1lbnRbMF0uciA9IE1hdGguYXRhbjIobW91c2VZIC0gZ2FtZUVsZW1lbnRbMF0ueSwgbW91c2VYIC0gZ2FtZUVsZW1lbnRbMF0ueCkgKiAoMTgwIC8gTWF0aC5QSSkgKyA4NTtcblx0fTtcblxuXHRjb25zdCBkcmF3ID0gKCkgPT4ge1xuXHRcdGdhbWVFbGVtZW50WzFdLnggLT0gNjtcblx0XHRpZiAoZ2FtZUVsZW1lbnRbMV0ueCA8PSAwKSBnYW1lRWxlbWVudFsxXS54ID0gMjkwO1xuXHRcdGdhbWVFbGVtZW50WzFdLnIgKz0gNTtcblxuXHRcdGdhbWVFbGVtZW50WzJdLnkgLT0gMztcblx0XHRpZiAoZ2FtZUVsZW1lbnRbMl0ueSA8PSAwKSBnYW1lRWxlbWVudFsyXS55ID0gMTkwO1xuXHRcdGdhbWVFbGVtZW50WzJdLnIgLT0gMztcblxuXHRcdGdhbWVFbGVtZW50WzNdLnggLT0gMztcblx0XHRnYW1lRWxlbWVudFszXS55IC09IDM7XG5cdFx0aWYgKGdhbWVFbGVtZW50WzNdLnggPD0gMCAmJiBnYW1lRWxlbWVudFszXS55IDw9IDApIHtcblx0XHRcdGdhbWVFbGVtZW50WzNdLnggPSAyMzA7XG5cdFx0XHRnYW1lRWxlbWVudFszXS55ID0gMTkwO1xuXHRcdH1cblx0XHRnYW1lRWxlbWVudFszXS5yICs9IDQ7XG5cdH1cblxuXHR1cGRhdGUgPSBzZXRJbnRlcnZhbChkcmF3LCAxMDApO1xuXG5cdC8vR2FtZSBjb21wbGV0ZVxuXHRjb25zdCBnYW1lQ29tcGxldGVkID0gKCkgPT4ge1xuXHRcdG1sRGF0YS5maW5pc2hUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cdFx0ZGlzcGF0Y2goJ2NvbXBsZXRlJywgbWxEYXRhKTtcblx0fTtcblxuXHQvL2NvbGxlY3QgY2xpY2tzXG5cdGNvbnN0IGNhcHRjaGFDbGljayA9ICgpID0+e1xuXHRcdG1sRGF0YS5tb3VzZUNsaWNrcyArPSAxO1xuXHR9O1xuPC9zY3JpcHQ+XG5cbjxzdHlsZT5cbiNKU0UtZ2FtZSB7XG5cdGhlaWdodDoxMDAlO1xuXHRiYWNrZ3JvdW5kOiMwMDA7XG5cdGN1cnNvcjogdXJsKCdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUI0QUFBQWVDQU1BQUFBTTdsNlFBQUFDblZCTVZFVlJVVk5UVkZSVFZGV3dGUkgvLy8vQURBdkNEUXRTVTFaVFZGVlZWbFJYV0ZsWVdWdkhDUWxVVlZWVVZWZFVWVmxWVmxkV1YxWldWMTFZV1Y1V1YxbFlXVnRYV0ZwWFdGcFlXVnBZV1Z0WFdGcFlXVnRYV0ZwWFdGcFlXVnBYV0ZwWVdWcFlXVm9FQkFRRUJBUUVCQVRIUERjREF3TUVCQVRIT3pZREJBUElPallBQUFBQkFRQUJBUUVDQWdJREF3UElPVFRKT0RNaUlpTWpKQ1FnSUNFaElTSWhJaUlmSHlBZ0lDRVBEdzhQRHc5WFdGcFlXVm9TRWhJVEV4TVJFUkVSRWhFU0VoSVRFeE1VRkJSWVdWcFlXVnNTRXhNVEV4TVRFeFJZV1Z0WVdWdFlXVnRZV1Z0WVdWcy9RRUkrUGo4OFBUNC9RRUU2T3p3L1AwRTlQajg4UFQwckxDMHFLaXNxS3lzcEtTb3RMaThyTEN3c0xTMHhNak1yS3l3eE1USXZNREV3TURFeE1qTXlNelF6TXpRd01USllXVnBZV1Z0WVdWcFlXVnRZV1ZwWVdWdFlXVnBZV1ZwWVdWdFlXVnBZV1Z0WVdWcFlXVnRZV1Z0WVdWdFlXVnRPVGs5T1RrOU9UMDlZV1Z0TlRsQk9UMUZOVGxCWVdWdE1UVTVNVFU5TlRrL0tPelpUVkZiS09UWExPalZNVFU5TlRVOVNVMVJVVlZYTE9EUk5UVTlOVGs5UlVsUlNVMVJVVkZWSlNreExURTFKU2t0S1MwMUtTMDFZV1Z0SlNVcExURTFZV1Z0S1NreFlXVnRYV0ZwWVdWdFdWMWxZV1Z0VlZsaFdWMWxZV1Z0WVdWdFlXVnRXVjFsWFdGbFhXRnBYV0ZwT1RsQkxURTVNVFU5RVJVZEZSVWRCUWtOQ1FrUkdSMGxZV1Z0RVJVWllXVnRZV1Z0WVdWdFlXVnRZV1Z0WVdWcFlXVnRQVUZGUVVGSlFVVk5SVWxSWVdWcFlXVnRZV1Z0UVVWTlJVbFJTVWxSUFVGSlFVVk5SVWxSU1UxVlJVbFJSVWxSUVVGSlFVVkpZV1Z0WFdGcFlXVnRZV1Z0WFdGcFlXVnROVGxCT1QxRlFVVkpRVVZOWFdGcFFVVk5ZV1Z0WVdWcFlXVnRXVjFsWFYxbFhXRmxYV0ZwWVdWdk1PalJTM1RCc0FBQUEyWFJTVGxNQUFBQUFBQUVCQWdJQ0FnSUNBd01EQXdNREF3UUVGaGNYRnhnWUhpTWpMaTR2T2pzOFBEMDlQVDQrUUVCQVFFQkFRRUpDUlVWRlIwaEpTa3RMVFUxT1RrNU9UazlQVUZCUVVsTlVWVmxoWTJSa1pXVm1hSEJ4Y1hKemRIUjBkWFYyZG5kM2QzaUdob2VIaVltS2k0dU1qSTJOa1ppWm01eWNuNkdob3FhcHFhbXJyS3lzcmEydHJhMnVycTZ1cnNEQXdjSER3OFRFeE1YRnlNakp5Y3JLeXN2TTBORFEwZFhXMXRmWTJkbmEydHZiM04zZTMrUGs1ZVhsNWVYbDV1Zm41K2pvNk9qcDZ1dnI3ZS92OFBUMTl2YjI5dmIzK1B2N09nSkhMd0FBQWpoSlJFRlVlTnFOaytkWFUwRVF4VkhYM2pWaUM4YUNndTY3QVFzV1JNV0tKZGg3cjBGQVVTSkJEVVFVZTdCM3hJS3hZcUVZTWZhdUtCb0ZGVTAwazcvRnpmTkJpTUxSKzJIMjdQbk56cmxuZGlhQStjbG85ci8vZ1Rkc3JoMDMxK2hPNXVxNnRhb1JCeVVWazZ6aXBDNS80U1o2SjduS0N0KzhLeXgza3pPdW9UL3VmSlpjaDFjTnc2WU1qRnArMEVVNUhhcmpqamE2dDFnQ1lOb3BnclRnUHRuYSszQWJLMTBieDhFUmxybzFUQnc4Sm8rc0xhcXdubDZNQU5COVd1YW5iNWt6Z2dGRVB5VjlKVlk3WGZNNDBQOTBnU0UyMWxCd0pnTGdjMzg2MVFwT3B1T2lZRCtIbk0vcXhqc0djRWhIS2ZrM2JtZDNMWlY0ajBzSlRGSGk1UkRPbDdqdEtobHJxQ3dTbVB6WVMvcUdlK09qcVJJaVA1Tkd4bEYwRXdqYnM0YXhabnM5bnUwTkdGdTNYd3RjcDZFQ0cxT3k2WlVwUGExVUo5NTZoUG93TnFZMExkMzBuTEpUakFGbXM1WGVXaXhaSHlZeEZ1N0ZvWXlOZlo5bHNaVFFCYk5aTG40TDBCNVl5MWo5SFI3UHRucEs4UnNVcFZnckY5YW15TlpDZTNyamsra1NobnhScktuczdtV2NCMTlKWklvU0x2YmlmQkhkVlZXMjVSUUhqM0RFMTVIN3VOb3hpRU02UWV0OVRaM0RnWUhuaXd3VEp4aUt6ZzBHK0d6M2Q3WHZTMTVHQXdpWnVmdmoxMzJ6ZWt1UVJqNmpPRmFKVzFvcEw0WkQrRS9kb2hVSEgzK1ZyRzJyTUF1MDBZT0ZFQW1tWFFKaS9rTzZIVmg5bURybDBJOGpLMFpqWXdhR3J6ems5aDhtb1VaeFRxS0svTmNsK1JVa1JyRnA3WU44Snltb3hqVm9yZEVkeTlWMWJmei9TL1NQRmZ3Rnpram1sN2loZjJVQUFBQUFTVVZPUks1Q1lJST0nKSwgYXV0bztcbn1cblxuLmdmeCB7XG5cdHBvc2l0aW9uOmFic29sdXRlO1xuXHRvcGFjaXR5OjE7XG5cdHRyYW5zaXRpb246IG9wYWNpdHkgMC42cztcbn1cblxuLmdmeC5hY3RpdmUge1xuXHRvcGFjaXR5OjA7XG59XG5cbi8qIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbk55WXk5amIyMXdiMjVsYm5SekwwRnpkR1Z5YjJsa2N5NXpkbVZzZEdVaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWp0QlFVTkJPME5CUTBNc1YwRkJWenREUVVOWUxHVkJRV1U3UTBGRFppd3lhVVZCUVRKcFJUdEJRVU0xYVVVN08wRkJSVUU3UTBGRFF5eHBRa0ZCYVVJN1EwRkRha0lzVTBGQlV6dERRVU5VTEhkQ1FVRjNRanRCUVVONlFqczdRVUZGUVR0RFFVTkRMRk5CUVZNN1FVRkRWaUlzSW1acGJHVWlPaUp6Y21NdlkyOXRjRzl1Wlc1MGN5OUJjM1JsY205cFpITXVjM1psYkhSbElpd2ljMjkxY21ObGMwTnZiblJsYm5RaU9sc2lYRzRqU2xORkxXZGhiV1VnZTF4dVhIUm9aV2xuYUhRNk1UQXdKVHRjYmx4MFltRmphMmR5YjNWdVpEb2pNREF3TzF4dVhIUmpkWEp6YjNJNklIVnliQ2duWkdGMFlUcHBiV0ZuWlM5d2JtYzdZbUZ6WlRZMExHbFdRazlTZHpCTFIyZHZRVUZCUVU1VFZXaEZWV2RCUVVGQ05FRkJRVUZsUTBGTlFVRkJRVTAzYkRaUlFVRkJRMjVXUWsxV1JWWlNWVlpPVkZaR1VsUldSbGQzUmxKSUx5OHZMMEZFUVhaRFJGRjBVMVV4V2xSV1JsWldWbXhTV0ZkR2JGbFhWblpJUTFGc1ZWWldWbFZXVm1SVlZsWnNWbFpzWkZkV01WcFhWakV4V1ZkV05WZFdNV3haVjFaMFdGZEdjRmhYUm5CWlYxWndXVmRXZEZoWFJuQlpWMVowV0ZkR2NGaFhSbkJaVjFad1dGZEdjRmxYVm5CWlYxWnZSVUpCVVVWQ1FWRkZRa0ZVU0ZCRVkwUkJkMDFGUWtGVVNFOTZXVVJDUVZCSlQycFpRVUZCUVVKQlVVRkNRVkZGUTBGblNVUkJkMUJKVDFSVVNrOUVUV2xKYVUxcVNrTlJaMGxEUldoSlUwbG9TV2xKWmtoNVFXZEpRMFZRUkhjNFVFUjNPVmhYUm5CWlYxWnZVMFZvU1ZSRmVFMVNSVkpGVWtWb1JWTkZhRWxVUlhoTlZVWkNVbGxYVm5CWlYxWnpVMFY0VFZSRmVFMVVSWGhTV1ZkV2RGbFhWblJaVjFaMFdWZFdkRmxYVm5NdlVVVkpLMUJxT0RoUVZEUXZVVVZGTms5NmR5OVFNRVU1VUdvNE9GQlVNSEpNUXpCeFMybHpjVXQ1YzNCTFUyOTBUR2s0Y2t4RGQzTk1VekI0VFdwTmNrdDVkM2hOVkVsMlRVUkZkMDFFUlhoTmFrMTVUWHBSZWsxNlVYZE5WRXBaVjFad1dWZFdkRmxYVm5CWlYxWjBXVmRXY0ZsWFZuUlpWMVp3V1ZkV2NGbFhWblJaVjFad1dWZFdkRmxYVm5CWlYxWjBXVmRXZEZsWFZuUlpWMVowVDFSck9VOVVhemxQVkRBNVdWZFdkRTVVYkVKUFZERkdUbFJzUWxsWFZuUk5WRlUxVFZSVk9VNVVheTlMVDNwYVZGWkdZa3RQVkZoTVQycFdUVlJWT1U1VVZUbFRWVEZTVlZaV1dFeFBSRkpPVkZVNVRsUnJPVkpWYkZKVFZURlNWVlpHVmtwVGEzaE1WRVV4U2xOcmRFdFRNREZMVXpBeFdWZFdkRXBUVlhCTVZFVXhXVmRXZEV0VGEzaFpWMVowV0ZkR2NGbFhWblJYVmpGc1dWZFdkRlpXYkdoWFZqRnNXVmRXZEZsWFZuUlpWMVowVjFZeGJGaFhSbXhZVjBad1dGZEdjRTlVYkVKTVZFVTFUVlJWT1VWU1ZXUkdVbFZrUWxGclRrTlJhMUpIVWpCc1dWZFdkRVZTVlZwWlYxWjBXVmRXZEZsWFZuUlpWMVowV1ZkV2RGbFhWbkJaVjFaMFVGVkdSbEZWUmtwUlZWWk9VbFZzVWxsWFZuQlpWMVowV1ZkV2RGRlZWazVTVld4U1UxVnNVbEJWUmtwUlZWWk9VbFZzVWxOVk1WWlNWV3hTVWxWc1VsRlZSa3BSVlZaS1dWZFdkRmhYUm5CWlYxWjBXVmRXZEZoWFJuQlpWMVowVGxSc1FrOVVNVVpSVlZaS1VWVldUbGhYUm5CUlZWWk9XVmRXZEZsWFZuQlpWMVowVjFZeGJGaFdNV3hZVjBac1dGZEdjRmxYVm5aTlQycFNVek5VUW5OQlFVRkJNbGhTVTFSc1RVRkJRVUZCUVVGRlFrRm5TVU5CWjBsRFFYZE5SRUYzVFVSQmQxRkZSbWhqV0VaNFoxbElhVTFxVEdrMGRrOXFjemhRUkRBNVVGUTBLMUZGUWtGUlJVSkJVVVZLUTFKVlZrWlNNR2hLVTJ0MFRGUlZNVTlVYXpWUFZHczVVRlZHUWxGVmJFNVZWbFpzYUZreVVtdGFWMVp0WVVoQ2VHTllTbnBrU0ZJd1pGaFdNbVJ1WkROa00ybEhhRzlsU0dsWmJVdHBOSFZOYWtreVRtdGFhVnB0TlhsamJqWkhhRzl4WVhCeFlXMXlja3Q1YzNKaE1uUnlZVEoxY25FMmRYSnpSRUYzWTBoRWR6aFVSWGhOV0VaNVRXcEtlV055UzNsemRrMHdUa1JSTUdSWVZ6RjBabGt5Wkc1aE1uUjJZak5PTTJVeksxQnJOV1ZZYkRWbFdHdzFkV1p1TlN0cWJ6WlBhbkEyZFhaeU4yVXZkamhRVkRFNWRtSXlPWFppTXl0UWRqZFBaMHBJVEhkQlFVRnFhRXBTUlVaVlpVNXhUbXNyWkZoVk1FVlJlRlpJV0ROcVZtbERPR0ZEWjNVMk4wRlJjMWRTVFZkTFNtUm9OM0l3UmtGVlUwcENSRlZSVldVM1FqTjRTVXQ0V1hGRldVMW1ZWFZMUW05R1JsVXdNR3MzTDBaNlprNUNhVTFNVWlzeVNESTNVRzVPZW5Kc2JtUnBZVUVyWTJ4dk9YSXZMMmRVWkhOeWFEQXpNU3RvVHpWMWNUWjBZVzlTUW5sVlZtczJlbWx3UXpVdk5GTmFOa28zYmt0RGRDczRTM2w0TTJ0NlQzVnZWQzkxWmtwYVkyZ3hZMDUzTmxsTmFrWndLekJGVlRWSVlYSnFhbXBoTm5ReFowTlpUbTl3WjNKVVoxQjBibUVyTTBGaVN6RXdZbmc0UlZKc2NtOHhWRUozT0VwdkszTk1ZWEYzYm13MlRVRk9RamxYZFdGdVlqVnJlbWRuUmtWUWVWWTVTbFpaTjFobVRUUXdVRGt3WjFORk1qRnNRbmRLWjB4bll6TTROakZSY0U5d2RVOXBXVVFyU0c1TkwzRjRhbk5IWTBWb1NFdG1hek5pYldRelRGcFdOR293YzBwVVJraHBOVkpFVDJ3M2FuUkxhR3h5Y1VOM1UyMVFlbGxUTDNGSFpTdFBhbkZTU1dsUU5VNUhlR3hHTUVWM2FtSnpOR0Y0V201ek9XNTFNRTVIUm5VeldIZDBZM0EyUlVOSE1VOTVObHBWY0ZCaE1WVktPVFUyYUZCdmQwNXhXVEJNWkRNd2JreEtWR3BCUm0xek5WaGxWMmw0V2toNVdYaEdkVGRHYjFsNVRtWmFPV3h6V2xSUlFtSk9Xa3h1TkV3d1FqVlplVEZxT1VoU04xQjBibkJMT0ZKelZYQldaM0pHT1dGdGVVNWFRMlV6Y21wcksydFRhRzU0VW5KTGJuTTNiVmRqUWpFNVNscEpiMU5NZG1KcFprSklaRlpXVnpJMVVsRklhak5FUlRFMVNEZDFUbTk0YVVWTk5sRmxkRGxVV2pORVoxbElibWwzZDFSS2VHbExlbWN3Unl0SGVqTmtOMWgyVXpFMVIwRjNhVnAxWm5acU1UTXllbVZyZFZGU2FqWnFUMFpoU2xjeGIzQk1ORnBFSzBVdlpHOW9WVWhJTXl0V2NrY3ljazFCZFRBd1dVOUdSVUZ0YlZoUlNta3ZhMDgyU0Zab09XMUVjbXd3U1RocVN6QmFhbGwzWVVkeWVucHJPV2c0Ylc5VlduaFVjVXRMTDA1amJDdFNWV3RTY2tad04xbE9PRXA1Ylc5NGFsWnZjbVJGWkhrNVZqRmlabm92VXk5VFVFWm1kMFo2YTJwdGJEZHBhR1l5VlVGQlFVRkJVMVZXVDFKTE5VTlpTVWs5Snlrc0lHRjFkRzg3WEc1OVhHNWNiaTVuWm5nZ2UxeHVYSFJ3YjNOcGRHbHZianBoWW5OdmJIVjBaVHRjYmx4MGIzQmhZMmwwZVRveE8xeHVYSFIwY21GdWMybDBhVzl1T2lCdmNHRmphWFI1SURBdU5uTTdYRzU5WEc1Y2JpNW5abmd1WVdOMGFYWmxJSHRjYmx4MGIzQmhZMmwwZVRvd08xeHVmVnh1SWwxOSAqLzwvc3R5bGU+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBb0hBLFNBQVMsZUFBQyxDQUFDLEFBQ1YsT0FBTyxJQUFJLENBQ1gsV0FBVyxJQUFJLENBQ2YsTUFBTSxDQUFFLElBQUksd2hFQUF3aEUsQ0FBQyxDQUFDLENBQUMsSUFBSSxBQUM1aUUsQ0FBQyxBQUVELElBQUksZUFBQyxDQUFDLEFBQ0wsU0FBUyxRQUFRLENBQ2pCLFFBQVEsQ0FBQyxDQUNULFVBQVUsQ0FBRSxPQUFPLENBQUMsSUFBSSxBQUN6QixDQUFDLEFBRUQsSUFBSSxPQUFPLGVBQUMsQ0FBQyxBQUNaLFFBQVEsQ0FBQyxBQUNWLENBQUMifQ== */";
    	append(document.head, style);
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.ele = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (6:1) {#each gameElement as ele, i}
    function create_each_block(ctx) {
    	var img, img_src_value, dispose;

    	function click_handler() {
    		return ctx.click_handler(ctx);
    	}

    	return {
    		c: function create() {
    			img = element("img");
    			img.draggable = draggable;
    			img.className = "gfx svelte-1er7ldi";
    			set_style(img, "transform", "rotate(" + ctx.ele.r + "deg)");
    			set_style(img, "top", "" + ctx.ele.y + "px");
    			set_style(img, "left", "" + ctx.ele.x + "px");
    			img.src = img_src_value = ctx.ele.src;
    			img.alt = "";
    			toggle_class(img, "active", ctx.ele.smashed);
    			add_location(img, file, 6, 2, 223);
    			dispose = listen(img, "click", click_handler, { once: true });
    		},

    		m: function mount(target, anchor) {
    			insert(target, img, anchor);
    		},

    		p: function update_1(changed, new_ctx) {
    			ctx = new_ctx;
    			if (changed.gameElement) {
    				set_style(img, "transform", "rotate(" + ctx.ele.r + "deg)");
    				set_style(img, "top", "" + ctx.ele.y + "px");
    				set_style(img, "left", "" + ctx.ele.x + "px");
    			}

    			if ((changed.gameElement) && img_src_value !== (img_src_value = ctx.ele.src)) {
    				img.src = img_src_value;
    			}

    			if (changed.gameElement) {
    				toggle_class(img, "active", ctx.ele.smashed);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(img);
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
    			div.className = "svelte-1er7ldi";
    			add_location(div, file, 4, 0, 82);

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

    const asteroidSource = 'data:image/png;base64,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';

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
    			y: 120,
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
    		if (!document.getElementById("svelte-1er7ldi-style")) add_css();
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    /* src\components\JSECaptcha.svelte generated by Svelte v3.5.1 */

    const file$1 = "src\\components\\JSECaptcha.svelte";

    function add_css$1() {
    	var style = element("style");
    	style.id = 'svelte-1eq8y27-style';
    	style.textContent = "#JSE-Captcha.flat.svelte-1eq8y27{background:none;padding:0px}#JSE-Captcha.flat.svelte-1eq8y27 details.svelte-1eq8y27{box-shadow:0px 0px 0px 4px rgba(0, 0, 0, 0.06)}#JSE-Captcha.S.svelte-1eq8y27{border-radius:6px;padding:8px;margin:5px;font-size:11px}#JSE-Captcha.S.svelte-1eq8y27 #JSE-input.svelte-1eq8y27{height:20px;min-width:20px;font-size:15px;border:solid 1px #D3D8DD;padding:2px;margin:6px}#JSE-Captcha.S.svelte-1eq8y27 #JSE-brand.svelte-1eq8y27{width:30px;border-left:solid 2px #F9F9F9}#JSE-Captcha.S.svelte-1eq8y27 #JSE-brand svg.svelte-1eq8y27{width:24px}#JSE-Captcha.S.flat.svelte-1eq8y27 details.svelte-1eq8y27{box-shadow:0px 0px 0px 2px rgba(0, 0, 0, 0.06)}#JSE-Captcha.M.svelte-1eq8y27{border-radius:6px;padding:8px;margin:5px;font-size:16px}#JSE-Captcha.M.svelte-1eq8y27 #JSE-input.svelte-1eq8y27{height:30px;min-width:30px;font-size:22px;border:solid 2px #D3D8DD;margin:8px}#JSE-Captcha.M.svelte-1eq8y27 #JSE-brand.svelte-1eq8y27{width:38px;border-left:solid 2px #F9F9F9}#JSE-Captcha.M.svelte-1eq8y27 #JSE-brand svg.svelte-1eq8y27{width:34px;margin-top:4px}#JSE-Captcha.M.flat.svelte-1eq8y27 details.svelte-1eq8y27{box-shadow:0px 0px 0px 2px rgba(0, 0, 0, 0.06)}#JSE-Captcha.L.svelte-1eq8y27{}#JSE-Captcha.L input#captchaCheck{width:30px;height:30px;margin:10px}#JSE-Captcha.svelte-1eq8y27{display:none;background:#F2F8FF;border-radius:6px;clear:both;padding:13px;margin:10px;min-width:200px;max-width:314px;color:#707070;font-size:20px;font-family:'Montserrat', sans-serif}#JSE-Captcha.svelte-1eq8y27 .svelte-1eq8y27{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}#JSE-Captcha.svelte-1eq8y27 details.svelte-1eq8y27{overflow:hidden;margin:0px;background:#fff;border-radius:4px;box-shadow:0px 3px 6px 0px rgba(0, 0, 0, 0.12)}#JSE-Captcha.svelte-1eq8y27 details summary.svelte-1eq8y27{display:flex;outline:none}#JSE-Captcha.svelte-1eq8y27 details #JSE-CaptchaDisplay.svelte-1eq8y27{opacity:0;margin:0px;padding:0px;height:0px;transition:opacity 0.2s, height 0.4s;background:#fff}#JSE-Captcha.svelte-1eq8y27 details.captchaPanel[open] #JSE-CaptchaDisplay.svelte-1eq8y27{-webkit-animation-name:svelte-1eq8y27-slideDown;animation-name:svelte-1eq8y27-slideDown;-webkit-animation-duration:0.3s;animation-duration:0.3s;-webkit-animation-fill-mode:forwards;animation-fill-mode:forwards;-webkit-animation-delay:0.3s;animation-delay:0.3s}#JSE-Captcha.svelte-1eq8y27 #JSE-input.svelte-1eq8y27{border:solid 4px #D3D8DD;border-radius:4px;margin:10px;min-width:40px;height:40px;cursor:pointer;font-size:28px;text-align:center;position:relative;overflow:hidden}#JSE-Captcha.svelte-1eq8y27 details>summary.svelte-1eq8y27::-webkit-details-marker{display:none}#JSE-Captcha.svelte-1eq8y27 details #JSE-input.svelte-1eq8y27:hover:before{content:'🤖';opacity:1}#JSE-Captcha.success.svelte-1eq8y27 details #JSE-input.svelte-1eq8y27:before{content:'😉';opacity:1}#JSE-Captcha.success.svelte-1eq8y27 details #JSE-input.svelte-1eq8y27:after{content:'✔';opacity:1;color:#26AE60;padding:0px 4px 0px 5px;border-left:solid 2px #D3D8DD}#JSE-Captcha.success.svelte-1eq8y27 details.captchaPanel[open] #JSE-input.svelte-1eq8y27:after{content:'';opacity:0;padding:0px;border:0px}#JSE-Captcha.svelte-1eq8y27 details #JSE-input.svelte-1eq8y27:before,#JSE-Captcha.svelte-1eq8y27 details.captchaPanel[open] #JSE-input.svelte-1eq8y27:before{opacity:0;content:'🤖';transition:opacity 0.2s;position:absolute;top:0px;left:0px;bottom:0px;right:0px;background:#fff}#JSE-Captcha.success.svelte-1eq8y27 details.captchaPanel #JSE-input.svelte-1eq8y27:before{right:50%}#JSE-Captcha.success.svelte-1eq8y27 details.captchaPanel[open] #JSE-input.svelte-1eq8y27:after{display:none}#JSE-Captcha.success.svelte-1eq8y27 details.captchaPanel #JSE-input.svelte-1eq8y27:after{left:50%;position:absolute;top:0px;bottom:0px;right:0px;background:#fff}#JSE-Captcha.success.svelte-1eq8y27 #JSE-input.svelte-1eq8y27{min-width:52px}#JSE-Captcha.success.svelte-1eq8y27 details.captchaPanel[open] #JSE-input.svelte-1eq8y27{min-width:20px}#JSE-Captcha.svelte-1eq8y27 details.captchaPanel[open] #JSE-input.svelte-1eq8y27:before{opacity:1}#JSE-Captcha.svelte-1eq8y27 #JSE-msg.svelte-1eq8y27{align-self:center;padding:0px 0px 0px 4px;flex:1}#JSE-Captcha.svelte-1eq8y27 #JSE-msg p.svelte-1eq8y27{vertical-align:bottom;display:inline-block;margin:0px;line-height:1.2}#JSE-Captcha.svelte-1eq8y27 #JSE-brand.svelte-1eq8y27{border-left:solid 3px #F9F9F9;align-self:center;width:60px;padding:0px 4px;text-align:center}#JSE-Captcha.svelte-1eq8y27 #JSE-brand svg.svelte-1eq8y27{fill:#51BFEC;width:48px}#JSE-Captcha.svelte-1eq8y27 #JSE-CaptchaDisplay #JSE-captcha-game-container.svelte-1eq8y27{background:#F2F8FF;border-radius:6px;height:100%;position:relative;overflow:hidden}#JSE-Captcha.svelte-1eq8y27 #JSE-CaptchaDisplay #JSE-captcha-game.svelte-1eq8y27{height:100%}@-webkit-keyframes svelte-1eq8y27-slideDown{from{opacity:0;height:0;padding:8px;border-top:solid 4px #F9F9F9}to{opacity:1;height:190px;padding:8px;border-top:solid 4px #F9F9F9}}@keyframes svelte-1eq8y27-slideDown{from{opacity:0;height:0;padding:8px;border-top:solid 4px #F9F9F9}to{opacity:1;height:190px;padding:8px;border-top:solid 4px #F9F9F9}}#JSE-Captcha.svelte-1eq8y27 details #JSE-msg>p.svelte-1eq8y27:after{content:'Im human'}#JSE-Captcha.svelte-1eq8y27 details.captchaPanel[open] #JSE-msg>p.svelte-1eq8y27:after,#JSE-Captcha.success.svelte-1eq8y27 details.captchaPanel[open] #JSE-msg>p.svelte-1eq8y27:after{content:'Im not a robot'}#JSE-Captcha.success.svelte-1eq8y27 details #JSE-msg>p.svelte-1eq8y27:after{content:'Verified human'}#JSE-input.svelte-1eq8y27 input[type=\"checkbox\"].svelte-1eq8y27{}#JSE-Captcha.active.svelte-1eq8y27{display:block}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSlNFQ2FwdGNoYS5zdmVsdGUiLCJzb3VyY2VzIjpbIkpTRUNhcHRjaGEuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjwhLS0gRE9NIFRhZyBOYW1lLS0+XG48c3ZlbHRlOm9wdGlvbnMgdGFnPVwianNlLWNhcHRjaGFcIi8+XG48IS0tIHhET00gVGFnIE5hbWUtLT5cblxuPCEtLSBKU0UgQ2FwdGNoYSAtLT5cbjwhLS0gXG5cdE9wdGlvbmFsIGNsYXNzZXNcblx0ZmxhdDogc3dhcHMgdG8gZmxhdCBkZXNpZ25cblx0UzogU21hbGwgY2FwdGNoYVxuXHRNOiBNZWNpdW0gY2FwdGNoYVxuXHRzdWNjZXNzOiBkaXNwbGF5cyBzdWNjZXNzIHBhbmVsIGNhcHRjaGEgbXVzdCBiZSBtaW5pbWlzZWRcbi0tPlxuXG48c2VjdGlvbiBpZD1cIkpTRS1DYXB0Y2hhXCIgY2xhc3M9XCJ7dGhlbWV9IHtzaXplfVwiIGNsYXNzOmFjdGl2ZT1cIntzaG93Q2FwdGNoYX1cIiBjbGFzczpzdWNjZXNzPVwie2NvbXBsZXRlfVwiPlxuXHQ8ZGV0YWlscyBjbGFzcz1cImNhcHRjaGFQYW5lbFwiIGJpbmQ6b3BlbiBvcGVuPlxuXHRcdDwhLS0gQ2FwdGNoYSBQYW5lbCAtLT5cblx0XHQ8c3VtbWFyeT5cblx0XHRcdDwhLS0gSW5wdXQgc2VsZWN0IGZpZWxkIC0tPlxuXHRcdFx0PGRpdiBpZD1cIkpTRS1pbnB1dFwiPlxuXHRcdFx0XHQ8aW5wdXQgaWQ9XCJjYXB0Y2hhQ2hlY2tcIiB0eXBlPVwiY2hlY2tib3hcIiBiaW5kOmNoZWNrZWQ9e2NhcHRjaGFDaGVja30gLz5cblx0XHRcdDwvZGl2PlxuXHRcdFx0PCEtLSB4SW5wdXQgc2VsZWN0IGZpZWxkIC0tPlxuXHRcdFx0XG5cdFx0XHQ8IS0tIEluZm8gbXNnIC0tPlxuXHRcdFx0PGRpdiBpZD1cIkpTRS1tc2dcIj5cblx0XHRcdFx0PHA+PC9wPlxuXHRcdFx0PC9kaXY+XG5cdFx0XHQ8IS0tIHhJbmZvIG1zZyAtLT5cblxuXHRcdFx0PCEtLSBKU0UgbG9nbyAtLT5cblx0XHRcdDxkaXYgaWQ9XCJKU0UtYnJhbmRcIj5cblx0XHRcdFx0PHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM6eGxpbms9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIgaWQ9XCJMYXllcl8xXCJcblx0XHRcdFx0XHR4PVwiMHB4XCIgeT1cIjBweFwiIHZpZXdCb3g9XCIwIDAgMTAwMCAxMDAwXCIgc3R5bGU9XCJ3aGl0ZS1zcGFjZTogcHJlc2VydmUtc3BhY2VzO1wiPlxuXHRcdFx0XHRcdDxnIGZpbHRlcj1cIm5vbmVcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoNDk4LDUwNykgdHJhbnNsYXRlKC00NDUuNTAzLC01MDAuOTk2KVwiXG5cdFx0XHRcdFx0XHRzdHlsZT1cImFuaW1hdGlvbjogYTBfdCAzLjZzIGxpbmVhciBpbmZpbml0ZSBib3RoO1wiPlxuXHRcdFx0XHRcdFx0PHBhdGhcblx0XHRcdFx0XHRcdFx0ZD1cIk01Ni4zLDU1Nkw1NS44LDcwNC4zQzU1LjksNzM1LjUsNzIuNyw3NjQuNSw5OS42LDc4MC4yTDIyOS4zLDg1NC41QzI1Niw4NjkuNywyODksODY5LjgsMzE2LjEsODU0LjdMNDQ2LjcsNzc5LjNDNDczLjYsNzYzLjgsNDkwLjUsNzM0LjksNDkwLjQsNzAzLjhMNDkwLjksNTU1LjVDNDkwLjgsNTI0LjMsNDc0LDQ5NS4zLDQ0Ny4xLDQ3OS42TDMxNy40LDQwNS4zQzI5MC43LDM5MC4xLDI1Ny43LDM5MCwyMzAuNiw0MDUuMUwxMDAsNDgwLjRDNzMuMSw0OTUuOSw1Ni4yLDUyNC44LDU2LjMsNTU2Wk0yNzMuMyw0NzBMNDExLjksNTUwLjhMNDExLjgsNzA5LjlMMjczLjksNzg5LjVMMTM2LDcxMEwxMzUuMyw1NDkuNkwyNzMuMyw0NzBaXCJcblx0XHRcdFx0XHRcdFx0dHJhbnNmb3JtPVwidHJhbnNsYXRlKC01NS44LC0wLjAzNzIyMTUpXCJcblx0XHRcdFx0XHRcdFx0c3R5bGU9XCJhbmltYXRpb246IGExX3QgMy42cyBsaW5lYXIgaW5maW5pdGUgYm90aDtcIiAvPlxuXHRcdFx0XHRcdFx0PHBhdGhcblx0XHRcdFx0XHRcdFx0ZD1cIk01MTAuMiw1NTYuM0w1MDkuNyw3MDQuNkM1MDkuOCw3MzUuOCw1MjYuNiw3NjQuOCw1NTMuNSw3ODAuNUw2ODMuMiw4NTQuOEM3MDkuOSw4NzAsNzQyLjksODcwLjEsNzcwLDg1NUw5MDAuNiw3NzkuNkM5MjcuNSw3NjQuMSw5NDQuNCw3MzUuMiw5NDQuMyw3MDQuMUw5NDQuOCw1NTUuOEM5NDQuNyw1MjQuNiw5MjcuOSw0OTUuNiw5MDEsNDc5LjlMNzcxLjMsNDA1LjZDNzQ0LjYsMzkwLjQsNzExLjYsMzkwLjMsNjg0LjUsNDA1LjRMNTUzLjksNDgwLjhDNTI3LjEsNDk2LjMsNTEwLjIsNTI1LjEsNTEwLjIsNTU2LjNaTTcyNy4yLDQ3MC40TDg2NS44LDU1MS4yTDg2NS43LDcxMC4zTDcyNy44LDc4OS45TDU5MCw3MTAuNEw1ODkuMyw1NTBMNzI3LjIsNDcwLjRaXCJcblx0XHRcdFx0XHRcdFx0dHJhbnNmb3JtPVwidHJhbnNsYXRlKC01NS44LC0wLjAzNzIyMTUpXCJcblx0XHRcdFx0XHRcdFx0c3R5bGU9XCJhbmltYXRpb246IGEyX3QgMy42cyBsaW5lYXIgaW5maW5pdGUgYm90aDtcIiAvPlxuXHRcdFx0XHRcdFx0PHBhdGhcblx0XHRcdFx0XHRcdFx0ZD1cIk0yODMsMTYyLjJMMjgyLjUsMzEwLjVDMjgyLjYsMzQxLjcsMjk5LjQsMzcwLjcsMzI2LjMsMzg2LjRMNDU2LDQ2MC43QzQ4Mi43LDQ3NS45LDUxNS43LDQ3Niw1NDIuOCw0NjAuOUw2NzMuNCwzODUuNUM3MDAuMywzNzAsNzE3LjIsMzQxLjEsNzE3LjEsMzEwTDcxNy42LDE2MS43QzcxNy41LDEzMC41LDcwMC43LDEwMS41LDY3My44LDg1LjhMNTQ0LjEsMTEuNUM1MTcuNCwtMy43LDQ4NC40LC0zLjgsNDU3LjMsMTEuM0wzMjYuNyw4Ni43QzI5OS44LDEwMi4yLDI4Mi45LDEzMSwyODMsMTYyLjJaTTQ5OS45LDc2LjNMNjM4LjUsMTU3TDYzOC40LDMxNi4xTDUwMC41LDM5NS43TDM2Mi43LDMxNi4yTDM2MiwxNTUuOUw0OTkuOSw3Ni4zWlwiXG5cdFx0XHRcdFx0XHRcdHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgtNTUuOCwtMC4wMzcyMjE1KVwiXG5cdFx0XHRcdFx0XHRcdHN0eWxlPVwiYW5pbWF0aW9uOiBhM190IDMuNnMgbGluZWFyIGluZmluaXRlIGJvdGg7XCIgLz5cblx0XHRcdFx0XHRcdDxnIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgtNTUuOCwtMC4wMzcyMjE1KVwiPlxuXHRcdFx0XHRcdFx0XHQ8Zz5cblx0XHRcdFx0XHRcdFx0XHQ8cGF0aFxuXHRcdFx0XHRcdFx0XHRcdFx0ZD1cIk01ODUuMyw4MTcuOEM1MjkuNCw4MzIuNiw0NzAuNSw4MzIuNiw0MTQuNiw4MTcuN0M0MDcsODE1LjcsMzk4LDgyMC4yLDM5Ni4xLDgyOC4yQzM5NC4zLDgzNi4xLDM5OC41LDg0NC41LDQwNi42LDg0Ni43QzQ2Ny41LDg2Mi45LDUzMi4zLDg2Mi45LDU5My4yLDg0Ni44QzYwMSw4NDQuNyw2MDUuOCw4MzYuMSw2MDMuNyw4MjguM0M2MDEuNiw4MjAuNCw1OTMuMiw4MTUuOCw1ODUuMyw4MTcuOEw1ODUuMyw4MTcuOFpcIiAvPlxuXHRcdFx0XHRcdFx0XHQ8L2c+XG5cdFx0XHRcdFx0XHQ8L2c+XG5cdFx0XHRcdFx0XHQ8ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTU1LjgsLTAuMDM3MjIxNSlcIj5cblx0XHRcdFx0XHRcdFx0PGc+XG5cdFx0XHRcdFx0XHRcdFx0PHBhdGhcblx0XHRcdFx0XHRcdFx0XHRcdGQ9XCJNMTgxLjEsNDEzLjZDMTk2LjIsMzU3LjUsMjI1LjcsMzA2LjcsMjY2LjYsMjY1LjZDMjcyLjMsMjU5LjksMjcyLjMsMjUwLjEsMjY2LjYsMjQ0LjRDMjYwLjksMjM4LjcsMjUxLjEsMjM4LjYsMjQ1LjQsMjQ0LjRDMjAxLDI4OSwxNjguNSwzNDQuOCwxNTIuMiw0MDUuNkMxNTAuMiw0MTMuMiwxNTQuNyw0MjIuMiwxNjIuNyw0MjQuMUMxNzAuNSw0MjUuOSwxNzguOSw0MjEuNywxODEuMSw0MTMuNkwxODEuMSw0MTMuNlpcIiAvPlxuXHRcdFx0XHRcdFx0XHQ8L2c+XG5cdFx0XHRcdFx0XHQ8L2c+XG5cdFx0XHRcdFx0XHQ8ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTU1LjgsLTAuMDM3MjIxNSlcIj5cblx0XHRcdFx0XHRcdFx0PGc+XG5cdFx0XHRcdFx0XHRcdFx0PHBhdGhcblx0XHRcdFx0XHRcdFx0XHRcdGQ9XCJNNzMzLjQsMjY1LjVDNzc0LjQsMzA2LjYsODAzLjgsMzU3LjQsODE4LjksNDEzLjVDODIxLDQyMS4zLDgyOS42LDQyNi4xLDgzNy40LDQyNEM4NDUuMyw0MjEuOCw4NTAsNDEzLjQsODQ3LjksNDA1LjVDODMxLjUsMzQ0LjcsNzk5LjEsMjg4LjgsNzU0LjYsMjQ0LjJDNzQ4LjksMjM4LjUsNzM5LjEsMjM4LjUsNzMzLjQsMjQ0LjJDNzI3LjYsMjUwLjEsNzI3LjYsMjU5LjgsNzMzLjQsMjY1LjVMNzMzLjQsMjY1LjVaXCIgLz5cblx0XHRcdFx0XHRcdFx0PC9nPlxuXHRcdFx0XHRcdFx0PC9nPlxuXHRcdFx0XHRcdDwvZz5cblx0XHRcdFx0PC9zdmc+XG5cdFx0XHQ8L2Rpdj5cblx0XHRcdDwhLS0geEpTRSBsb2dvIC0tPlxuXHRcdDwvc3VtbWFyeT5cblx0XHQ8IS0tIHhDYXB0Y2hhIFBhbmVsIC0tPlxuXG5cdFx0PCEtLSBDYXB0Y2hhIEdhbWUgLS0+XG5cdFx0PGRpdiBpZD1cIkpTRS1DYXB0Y2hhRGlzcGxheVwiPlxuXHRcdFx0PGRpdiBpZD1cIkpTRS1jYXB0Y2hhLWdhbWUtY29udGFpbmVyXCIgb246bW91c2Vtb3ZlPVwie2hhbmRsZU1vdmVtZW50fVwiIG9uOnRvdWNobW92ZT1cIntoYW5kbGVNb3ZlbWVudH1cIj5cblx0XHRcdHsjaWYgb3Blbn1cdFxuXHRcdFx0XHQ8ZGl2IGlkPVwiSlNFLWNhcHRjaGEtZ2FtZVwiPlxuXHRcdFx0XHRcdDxBc3Rlcm9pZHMgb246Y29tcGxldGU9XCJ7Y2FsbGJhY2tGdW5jdGlvbn1cIiAvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdHsvaWZ9XG5cdFx0XHQ8L2Rpdj5cblx0XHQ8L2Rpdj5cblx0XHQ8IS0tIHhDYXB0Y2hhIEdhbWUgLS0+XG5cdDwvZGV0YWlscz5cbjwvc2VjdGlvbj5cbjwhLS0geEpTRSBDYXB0Y2hhIC0tPlxuPCEtLVxuPExvYWRhYmxlIGxvYWRlcj17Z2V0RGVsYXllZExvYWRlcigpfT5cbiAgPGRpdiBzbG90PVwibG9hZGluZ1wiPkxvYWRpbmcgYW5kIGJsZXNzZWQgdG8gc3VjY2VlZC4uLjwvZGl2PlxuICA8ZGl2IHNsb3Q9XCJzdWNjZXNzXCIgbGV0OmNvbXBvbmVudD5cbiAgICA8c3ZlbHRlOmNvbXBvbmVudCB0aGlzPXtjb21wb25lbnR9IGN1c3RvbVByb3A9e3RydWV9IC8+XG4gIDwvZGl2PlxuPC9Mb2FkYWJsZT5cbi0tPlxuXG5cblxuXG48c2NyaXB0PlxuXHQvL2xpYnNcblx0aW1wb3J0IHsgb25Nb3VudCwgY3JlYXRlRXZlbnREaXNwYXRjaGVyIH0gZnJvbSAnc3ZlbHRlJztcblx0aW1wb3J0IEFzdGVyb2lkcyBmcm9tICcuL0FzdGVyb2lkcy5zdmVsdGUnXG5cdC8vaW1wb3J0IExvYWRhYmxlIGZyb20gJy4vTG9hZGFibGUuc3ZlbHRlJyAvL2NhbnQgY29kZSBzcGxpdCBpaWZlXG5cblx0Ly9Qcm9wc1xuXHRleHBvcnQgbGV0IHNpemUgPSAnTCc7XG5cdGV4cG9ydCBsZXQgdGhlbWUgPSAnZmxhdCc7XG5cdGV4cG9ydCBsZXQgY2FwdGNoYVNlcnZlciA9ICdodHRwczovL2xvYWQuanNlY29pbi5jb20nO1xuXHRcblx0Lypcblx0bGV0IHJldHJ5XG5cblx0Y29uc3QgZ2V0RGVsYXllZExvYWRlciA9IChkZWxheSA9IDMwMDApID0+ICgpID0+XG5cdFx0bmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT5cblx0XHRzZXRUaW1lb3V0KCgpID0+IHJlc29sdmUoaW1wb3J0KCcuL0FzeW5jQ29tcG9uZW50LnN2ZWx0ZScpKSwgZGVsYXkpLFxuXHRcdClcblxuXHRjb25zdCBnZXRGYWlsdXJlTG9hZGVyID0gKGRlbGF5ID0gMzAwMCkgPT4gKCkgPT5cblx0XHRuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PlxuXHRcdHNldFRpbWVvdXQoKCkgPT4gcmVqZWN0KG5ldyBFcnJvcignU29tZSBlcnJvcicpKSwgZGVsYXkpLFxuXHRcdClcblx0Ki9cblxuXHQvL0V2ZW50c1xuXHRjb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpO1xuXHRcblx0Ly9Jbml0IGNhcHRjaGFcblx0bGV0IG9wZW4gPSBmYWxzZTtcblx0bGV0IHNob3dDYXB0Y2hhID0gZmFsc2U7XG5cdGxldCBjYXB0Y2hhQ2hlY2sgPSBmYWxzZTtcblx0bGV0IGNvbXBsZXRlID0gZmFsc2U7XG5cdHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdHNob3dDYXB0Y2hhID0gdHJ1ZTtcblx0fSwgMTApO1xuXG5cdC8vTW91bnRlZFxuXHRvbk1vdW50KCgpID0+IHtcblx0fSk7XG5cblx0Ly9TdWNjZXNzXG5cdGRpc3BhdGNoKCdzdWNjZXNzJywgJ3N1Y2Nlc3MgZXZlbnQgc2VudCcpO1xuXG5cdC8vTWV0aG9kc1xuXHQvKipcbiAgICAgKiByZXF1ZXN0VVJMXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHJlcXVlc3RcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVxdWVzdC5tZXRob2QgVGhlIEhUVFAgbWV0aG9kIHRvIHVzZSBmb3IgdGhlIHJlcXVlc3QuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHJlcXVlc3QudXJsIFRoZSBVUkwgZm9yIHRoZSByZXF1ZXN0XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHJlcXVlc3QuY29udGVudCBUaGUgYm9keSBjb250ZW50IGZvciB0aGUgcmVxdWVzdC4gTWF5IGJlIGEgc3RyaW5nIG9yIGFuIEFycmF5QnVmZmVyIChmb3IgYmluYXJ5IGRhdGEpLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXF1ZXN0LmhlYWRlcnMgQW4gb2JqZWN0IGRlc2NyaWJpbmcgaGVhZGVycyB0byBhcHBseSB0byB0aGUgcmVxdWVzdCB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHJlcXVlc3QucmVzcG9uc2VUeXBlIFRoZSBYTUxIdHRwUmVxdWVzdFJlc3BvbnNlVHlwZSB0byBhcHBseSB0byB0aGUgcmVxdWVzdC5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHJlcXVlc3QuYWJvcnRTaWduYWwgQW4gQWJvcnRTaWduYWwgdGhhdCBjYW4gYmUgbW9uaXRvcmVkIGZvciBjYW5jZWxsYXRpb24uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHJlcXVlc3QudGltZW91dCBUaGUgdGltZSB0byB3YWl0IGZvciB0aGUgcmVxdWVzdCB0byBjb21wbGV0ZSBiZWZvcmUgdGhyb3dpbmcgYSBUaW1lb3V0RXJyb3IuIE1lYXN1cmVkIGluIG1pbGxpc2Vjb25kcy5cbiAgICAgKi9cbiAgICBjb25zdCByZXF1ZXN0VVJMID0gKHJlcXVlc3QpID0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlICgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgICAgICAgICAgeGhyLm9wZW4ocmVxdWVzdC5tZXRob2QsIHJlcXVlc3QudXJsLCB0cnVlKTtcbiAgICAgICAgICAgIC8veGhyLndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignWC1SZXF1ZXN0ZWQtV2l0aCcsICdYTUxIdHRwUmVxdWVzdCcpO1xuXG4gICAgICAgICAgICAvL3NldCBoZWFkZXJzXG4gICAgICAgICAgICBpZiAocmVxdWVzdC5oZWFkZXJzKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXMocmVxdWVzdC5oZWFkZXJzKVxuICAgICAgICAgICAgICAgICAgICAuZm9yRWFjaCgoaGVhZGVyKSA9PiB4aHIuc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIHJlcXVlc3QuaGVhZGVyc1toZWFkZXJdKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vc2V0IHJlc3BvbnNlIHR5cGVcbiAgICAgICAgICAgIGlmIChyZXF1ZXN0LnJlc3BvbnNlVHlwZSkge1xuICAgICAgICAgICAgICAgIHhoci5yZXNwb25zZVR5cGUgPSByZXF1ZXN0LnJlc3BvbnNlVHlwZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9hYm9ydCByZXFcbiAgICAgICAgICAgIGlmIChyZXF1ZXN0LmFib3J0U2lnbmFsKSB7XG4gICAgICAgICAgICAgICAgcmVxdWVzdC5hYm9ydFNpZ25hbC5vbmFib3J0ID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB4aHIuYWJvcnQoKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL3RpbWVvdXQgdGltZVxuICAgICAgICAgICAgaWYgKHJlcXVlc3QudGltZW91dCkge1xuICAgICAgICAgICAgICAgIHhoci50aW1lb3V0ID0gcmVxdWVzdC50aW1lb3V0O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL29uIHN0YXRlIGNoYW5nZVxuICAgICAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlcXVlc3QuYWJvcnRTaWduYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuYWJvcnRTaWduYWwub25hYm9ydCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBTb21lIGJyb3dzZXJzIHJlcG9ydCB4aHIuc3RhdHVzID09IDAgd2hlbiB0aGVcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVzcG9uc2UgaGFzIGJlZW4gY3V0IG9mZiBvciB0aGVyZSdzIGJlZW4gYSBUQ1AgRklOLlxuICAgICAgICAgICAgICAgICAgICAvLyBUcmVhdCBpdCBsaWtlIGEgMjAwIHdpdGggbm8gcmVzcG9uc2UuXG4gICAgICAgICAgICAgICAgICAgIGlmICh4aHIuc3RhdHVzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiAyMDAsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1c1RleHQ6IHhoci5zdGF0dXNUZXh0IHx8IG51bGwsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHhoci5yZXNwb25zZSB8fCB4aHIucmVzcG9uc2VUZXh0IHx8IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDwgMzAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiB4aHIuc3RhdHVzLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXNUZXh0OiB4aHIuc3RhdHVzVGV4dCwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogeGhyLnJlc3BvbnNlIHx8IHhoci5yZXNwb25zZVRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlOiB4aHIuc3RhdHVzVGV4dCwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogeGhyLnN0YXR1cyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy9jYXRjaCBlcnJvcnNcbiAgICAgICAgICAgIHhoci5vbmVycm9yID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdCh7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZTogeGhyLnN0YXR1c1RleHQsIFxuICAgICAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiB4aHIuc3RhdHVzXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvL3RpbWVvdXRcbiAgICAgICAgICAgIHhoci5vbnRpbWVvdXQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlOiAnQSB0aW1lb3V0IG9jY3VycmVkJywgXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6ICd0aW1lb3V0JyxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vaW5pdCByZXFcbiAgICAgICAgICAgIHhoci5zZW5kKHJlcXVlc3QuY29udGVudCB8fCAnJyk7XG4gICAgICAgIH0pO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBsb2FkR2FtZVxuXHQgKiBkaXNhYmxlZCB1bnRpbCBmaWd1cmUgYmVzdCB3YXkgdG8gZG8gY29kZSBzcGxpdHRpbmcuLi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZ2FtZUZpbGUgdXJsIG9mIGdhbWVmaWxlIHRvIGxvYWRcbiAgICAgKiBAcGFyYW0ge2NhbGxiYWNrfSBjYiBDYWxsYmFjayBmdW5jdGlvblxuXHQgKi9cblx0Y29uc3QgbG9hZEdhbWUgPSAoZ2FtZUZpbGUsY2IpID0+IHtcblx0XHQvKlxuXHRcdCAvL3JlcXVlc3QgY29uZlxuICAgICAgICByZXF1ZXN0VVJMKHtcbiAgICAgICAgICAgIG1ldGhvZDogJ2dldCcsXG4gICAgICAgICAgICB1cmw6IGAke2NhcHRjaGFTZXJ2ZXJ9L2NhcHRjaGEvbG9hZC8ke2dhbWVGaWxlfWBcbiAgICAgICAgLy9zdWNjZXNzXG4gICAgICAgIH0pLnRoZW4oKHJlcykgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coJ1tyZXNdW2xvYWRDb25mXScscmVzKTtcblx0XHRcdGNiKHJlcy5jb250ZW50KTtcbiAgICAgICAgICAgIFxuICAgICAgICAvL2Vycm9yXG4gICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcblx0XHR9KTtcblx0XHQqL1xuXHR9XG5cblx0LyoqXG5cdCAqIGdhbWVDb21wbGV0ZWRcblx0ICogZGlzYWJsZWQgdW50aWwgZmlndXJlIGJlc3Qgd2F5IHRvIGRvIGNvZGUgc3BsaXR0aW5nLi4uXG5cdCAqL1xuXHRjb25zdCBnYW1lQ29tcGxldGVkID0gKCkgPT4ge1xuXHRcdGNvbnNvbGUubG9nKCdib29tJyk7XG5cdFx0Lypcblx0XHRtbERhdGEuZmluaXNoVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdG1sRGF0YS5nYW1lc0NvbXBsZXRlZCArPSAxO1xuXHRcdHN1Ym1pdE1MRGF0YShcblx0XHQocmVzKSA9PiB7XG5cdFx0XHR2YXIgSlNFQ2FwdGNoYVBhc3MgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKTtcblx0XHRcdEpTRUNhcHRjaGFQYXNzLmluaXRFdmVudCgnSlNFQ2FwdGNoYVBhc3MnLCB0cnVlLCB0cnVlKTtcblx0XHRcdEpTRUNhcHRjaGFQYXNzLmlwID0gcmVzLmlwO1xuXHRcdFx0SlNFQ2FwdGNoYVBhc3MucmF0aW5nID0gcmVzLnJhdGluZztcblx0XHRcdEpTRUNhcHRjaGFQYXNzLnBhc3MgPSByZXMucGFzcztcblx0XHRcdGRvY3VtZW50LmRpc3BhdGNoRXZlbnQoSlNFQ2FwdGNoYVBhc3MpO1xuXHRcdFx0c2VsZi5KU0VDYXB0Y2hhQ29tcGxldGVkID0gdHJ1ZTtcblx0XHR9LCAocmVzKSA9PiB7XG5cdFx0XHRsb2FkUmFuZG9tR2FtZSgpO1xuXHRcdH0pOyovXG5cdH07XG5cblx0LyoqXG5cdCAqIGxvYWRSYW5kb21HYW1lXG5cdCAqIGxvYWRzIHJhbmRvbSBnYW1lIGZpeGVkIHRvIGFzdGVyb2lkcyBmb3Igbm93Li5cblx0ICovXG5cdGNvbnN0IGxvYWRSYW5kb21HYW1lID0gKCkgPT4ge1xuXHRcdC8vY29uc3QgZ2FtZXMgPSBbJ2FzdGVyb2lkcy5qcycsICd0aWN0YWN0b2UuanMnLCAncGlsb3QuanMnXTsgXG5cdFx0Y29uc3QgZ2FtZXMgPSBbJ2FzdGVyb2lkcy5qcyddOyBcblx0XHRjb25zdCBjaG9vc2VuR2FtZSA9IGdhbWVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpnYW1lcy5sZW5ndGgpXTtcblx0XHRsb2FkR2FtZShjaG9vc2VuR2FtZSwgKGdhbWVDb2RlKSA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZyhnYW1lQ29kZSk7XG5cdFx0XHRjb25zdCBnYW1lID0gbmV3IEZ1bmN0aW9uKGdhbWVDb2RlKTtcblx0XHRcdGdhbWUoKTtcblxuXHRcdH0pO1xuXHR9XG5cblx0Ly9EYXRhXG4gXHRjb25zdCBtbERhdGEgPSB7XG5cdFx0bG9hZFRpbWU6IG5ldyBEYXRlKCkuZ2V0VGltZSgpLFxuXHRcdHRpY2tUaW1lOiAwLFxuXHRcdGZpbmlzaFRpbWU6IDAsXG5cdFx0bW91c2VYOiAwLFxuXHRcdG1vdXNlWTogMCxcblx0XHRtb3VzZVVwOiAwLFxuXHRcdG1vdXNlRG93bjogMCxcblx0XHRtb3VzZUxlZnQ6IDAsXG5cdFx0bW91c2VSaWdodDogMCxcblx0XHRtb3VzZUNsaWNrczogMCxcblx0XHRtb3VzZUV2ZW50czogMCxcblx0XHRtb3VzZVBhdHRlcm46IFtdLFxuXHRcdGdhbWVzQ29tcGxldGVkOiAwLFxuXHRcdGNoZWNrQm94OiAwXG5cdH07XG5cblx0bWxEYXRhLnVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuXHRtbERhdGEudXNlckFnZW50ID0gbmF2aWdhdG9yLnVzZXJBZ2VudCB8fCAwO1xuXHRtbERhdGEucGxhdGZvcm0gPSBuYXZpZ2F0b3IucGxhdGZvcm0gfHwgMDtcblx0bWxEYXRhLnJlZmVycmVyID0gZG9jdW1lbnQucmVmZXJyZXIgfHwgMDtcblx0bWxEYXRhLnJ1bk9uY2UgPSB3aW5kb3cuSlNFUnVuT25jZSB8fCBmYWxzZTtcblx0bWxEYXRhLmxhbmd1YWdlID0gd2luZG93Lm5hdmlnYXRvci5sYW5ndWFnZSB8fCAwO1xuXG5cdGlmIChuYXZpZ2F0b3IubGFuZ3VhZ2VzKSB7IFxuXHRcdG1sRGF0YS5sYW5ndWFnZXMgPSBuYXZpZ2F0b3IubGFuZ3VhZ2VzLmpvaW4oJycpIHx8IDA7XG5cdH0gZWxzZSB7XG5cdFx0bWxEYXRhLmxhbmd1YWdlcyA9IDE7XG5cdH1cblxuXHRtbERhdGEudGltZXpvbmVPZmZzZXQgPSBuZXcgRGF0ZSgpLmdldFRpbWV6b25lT2Zmc2V0KCkgfHwgMDtcblx0bWxEYXRhLmFwcE5hbWUgPSB3aW5kb3cubmF2aWdhdG9yLmFwcE5hbWUgfHwgMDtcblx0bWxEYXRhLnNjcmVlbldpZHRoID0gd2luZG93LnNjcmVlbi53aWR0aCB8fCAwO1xuXHRtbERhdGEuc2NyZWVuSGVpZ2h0ID0gd2luZG93LnNjcmVlbi5oZWlnaHQgfHwgMDtcblx0bWxEYXRhLnNjcmVlbkRlcHRoID0gd2luZG93LnNjcmVlbi5jb2xvckRlcHRoIHx8IDA7XG5cdG1sRGF0YS5zY3JlZW4gPSBtbERhdGEuc2NyZWVuV2lkdGgrJ3gnK21sRGF0YS5zY3JlZW5IZWlnaHQrJ3gnK21sRGF0YS5zY3JlZW5EZXB0aDsgLy8gMTkyMHgxMDgweDI0XG5cdG1sRGF0YS5pbm5lcldpZHRoID0gd2luZG93LmlubmVyV2lkdGggfHwgMDtcblx0bWxEYXRhLmlubmVySGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0IHx8IDA7XG5cdG1sRGF0YS5kZXZpY2VNZW1vcnkgPSBuYXZpZ2F0b3IuZGV2aWNlTWVtb3J5IHx8IG5hdmlnYXRvci5oYXJkd2FyZUNvbmN1cnJlbmN5IHx8IDA7XG5cdG1sRGF0YS5wcm90b1N0cmluZyA9IE9iamVjdC5rZXlzKG5hdmlnYXRvci5fX3Byb3RvX18pLmpvaW4oJycpLnN1YnN0cmluZygwLCAxMDApIHx8IDA7XG5cblx0aWYgKHdpbmRvdy5mcmFtZUVsZW1lbnQgPT09IG51bGwpIHtcblx0XHRtbERhdGEuaUZyYW1lID0gZmFsc2U7XG5cdH0gZWxzZSB7XG5cdFx0bWxEYXRhLmlGcmFtZSA9IHRydWU7XG5cdH1cblx0XG5cblxuXHQvL29uIGRldGFpbHMgb3BlblxuXHQkOiBpZiAob3Blbikge1xuXHRcdG1sRGF0YS50aWNrVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdGxvYWRSYW5kb21HYW1lKCk7XG5cdH0gZWxzZSB7XG5cblx0fVxuXG5cdC8vaW5wdXQgc2VsZWN0ZWRcblx0JDogbWxEYXRhLmNoZWNrQm94ID0gKGNhcHRjaGFDaGVjayk/MTowO1xuXHQvLyQ6IGNvbnNvbGUubG9nKCdjaGVjaycsIGNhcHRjaGFDaGVjayk7XG5cblx0Ly90cmFjayBtb3ZlbWVudFxuXHRjb25zdCBoYW5kbGVNb3ZlbWVudCA9IChlKSA9PiB7XG5cdFx0Y29uc3QgcmVjdCA9IGUuY3VycmVudFRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0XHRpZiAoZS5wYWdlWCA9PT0gbnVsbCkge1xuXHRcdFx0Y29uc3QgZURvYyA9IChlLnRhcmdldCAmJiBlLnRhcmdldC5vd25lckRvY3VtZW50KSB8fCBkb2N1bWVudDtcblx0XHRcdGNvbnN0IGRvYyA9IGVEb2MuZG9jdW1lbnRFbGVtZW50O1xuXHRcdFx0Y29uc3QgYm9keSA9IGVEb2MuYm9keTtcblx0XHRcdGUucGFnZVggPSBNYXRoLmZsb29yKChlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdLmNsaWVudFggfHwgZS5jbGllbnRYIHx8IDApICtcblx0XHRcdFx0KGRvYyAmJiBkb2Muc2Nyb2xsTGVmdCB8fCBib2R5ICYmIGJvZHkuc2Nyb2xsTGVmdCB8fCAwKSAtXG5cdFx0XHRcdChkb2MgJiYgZG9jLmNsaWVudExlZnQgfHwgYm9keSAmJiBib2R5LmNsaWVudExlZnQgfHwgMCkpO1xuXHRcdFx0ZS5wYWdlWSA9IE1hdGguZmxvb3IoKGUudG91Y2hlcyAmJiBlLnRvdWNoZXNbMF0uY2xpZW50WSB8fCBlLmNsaWVudFkgfHwgMCkgK1xuXHRcdFx0XHQoZG9jICYmIGRvYy5zY3JvbGxUb3AgfHwgYm9keSAmJiBib2R5LnNjcm9sbFRvcCB8fCAwKSAtXG5cdFx0XHRcdChkb2MgJiYgZG9jLmNsaWVudFRvcCB8fCBib2R5ICYmIGJvZHkuY2xpZW50VG9wIHx8IDApKTtcblx0XHR9XG5cdFx0Y29uc3QgbW91c2VYID0gZS5wYWdlWCAtIHJlY3QubGVmdDtcblx0XHRjb25zdCBtb3VzZVkgPSBlLnBhZ2VZIC0gcmVjdC50b3A7XG5cblx0XHRtbERhdGEubW91c2VFdmVudHMgKz0gMTtcblx0XHRpZiAobW91c2VZIDwgbWxEYXRhLm1vdXNlWSkgbWxEYXRhLm1vdXNlRG93biArPSAxO1xuXHRcdGlmIChtb3VzZVkgPiBtbERhdGEubW91c2VZKSBtbERhdGEubW91c2VVcCArPSAxO1xuXHRcdGlmIChtb3VzZVggPiBtbERhdGEubW91c2VYKSBtbERhdGEubW91c2VSaWdodCArPSAxO1xuXHRcdGlmIChtb3VzZVggPCBtbERhdGEubW91c2VYKSBtbERhdGEubW91c2VMZWZ0ICs9IDE7XG5cblx0XHRtbERhdGEubW91c2VYID0gbW91c2VYO1xuXHRcdG1sRGF0YS5tb3VzZVkgPSBtb3VzZVk7XG5cdFx0bWxEYXRhLm1vdXNlUGF0dGVybi5wdXNoKHBhcnNlSW50KG1vdXNlWCkgKyAneCcgKyBwYXJzZUludChtb3VzZVkpKTtcblx0fVxuXHRcblx0Y29uc3QgY2FsbGJhY2tGdW5jdGlvbiA9IChlKSA9PiB7XG5cdFx0Y29uc29sZS5sb2coJ2NvbXBsZXRlJylcblx0XHRtbERhdGEuZ2FtZXNDb21wbGV0ZWQgKz0gMTtcblx0XHRtbERhdGEubW91c2VDbGlja3MgPSBlLmRldGFpbC5tb3VzZUNsaWNrcztcblx0XHRtbERhdGEuZmluaXNoVGltZSA9IGUuZGV0YWlsLmZpbmlzaFRpbWU7IFxuXHRcdFxuXHRcdC8vY2xvc2UgY2FwdGNoYVxuXHRcdG9wZW4gPSBmYWxzZTtcblxuXHRcdC8vc3VibWl0IGRhdGFcblx0XHRzdWJtaXRNTERhdGEoXG5cdFx0XHQocmVzKSA9PiB7XG5cdFx0XHRcdGNvbnN0IEpTRUNhcHRjaGFQYXNzID0ge307XG5cdFx0XHRcdEpTRUNhcHRjaGFQYXNzLmlwID0gcmVzLmlwO1xuXHRcdFx0XHRKU0VDYXB0Y2hhUGFzcy5yYXRpbmcgPSByZXMucmF0aW5nO1xuXHRcdFx0XHRKU0VDYXB0Y2hhUGFzcy5wYXNzID0gcmVzLnBhc3M7XG5cdFx0XHRcdFxuXHRcdFx0XHRkaXNwYXRjaCgnc3VjY2VzcycsIEpTRUNhcHRjaGFQYXNzKTtcblx0XHRcdFx0Y29tcGxldGUgPSB0cnVlO1xuXHRcdFx0fSwgXG5cdFx0XHQocmVzKSA9PiB7XG5cdFx0XHRcdG9wZW4gPSB0cnVlO1xuXHRcdFx0XHRkaXNwYXRjaCgnZmFpbCcsIDEpO1xuXHRcdFx0XHRsb2FkUmFuZG9tR2FtZSgpO1xuXHRcdFx0fVxuXHRcdCk7XG5cdH1cblxuXG5cdC8qKlxuXHQgKiBzdWJtaXRNTERhdGFcblx0ICogc3VibWl0IGRhdGEgd2l0aCBjYWxsYmFjayBjb2RlIHN1Y2NlcyBmYWlsXG4gICAgICogQHBhcmFtIHtjYWxsYmFja30gcGFzc0NhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtjYWxsYmFja30gZmFpbENhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uXG5cdCAqL1xuXHRjb25zdCBzdWJtaXRNTERhdGEgPSAocGFzc0NhbGxiYWNrLCBmYWlsQ2FsbGJhY2spID0+IHtcblx0XHRjb25zdCBjbGVhbkRhdGFTdHJpbmcgPSBwcmVwTUxEYXRhKCk7XG5cblx0XHRyZXF1ZXN0VVJMKHtcbiAgICAgICAgICAgIG1ldGhvZDogJ3Bvc3QnLFxuXHRcdFx0dXJsOiBgJHtjYXB0Y2hhU2VydmVyfS9jYXB0Y2hhL3JlcXVlc3QvYCxcblx0XHRcdGNvbnRlbnQ6IGNsZWFuRGF0YVN0cmluZyxcblx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcblx0XHRcdH0sXG4gICAgICAgIC8vc3VjY2Vzc1xuICAgICAgICB9KS50aGVuKChyZXMpID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKCdbcmVzXVtsb2FkQ29uZl0nLHJlcyk7XG5cdFx0XHRyZXMgPSBKU09OLnBhcnNlKHJlcy5jb250ZW50KTtcblx0XHRcdGlmICgocmVzLnBhc3MpICYmIChyZXMucGFzcyA9PT0gdHJ1ZSkpIHtcblx0XHRcdFx0cGFzc0NhbGxiYWNrKHJlcyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRmYWlsQ2FsbGJhY2socmVzKTtcblx0XHRcdH1cbiAgICAgICAgLy9lcnJvclxuICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGVycik7XG5cdFx0XHRmYWlsQ2FsbGJhY2socmVzKTtcblx0XHR9KTtcblx0fTtcblxuXHQvKipcblx0ICogcHJlcE1MRGF0YVxuXHQgKiBQcmVwYXJlIE1MIGRhdGFcblx0ICovXG5cdGNvbnN0IHByZXBNTERhdGEgPSAoKSA9PiB7XG5cdFx0Y29uc3QgY2xlYW5EYXRhID0gbWxEYXRhO1xuXHRcdGNsZWFuRGF0YS5tb3VzZVBhdHRlcm4gPSBjbGVhbkRhdGEubW91c2VQYXR0ZXJuLnNsaWNlKGNsZWFuRGF0YS5tb3VzZVBhdHRlcm4ubGVuZ3RoLTIwMCxjbGVhbkRhdGEubW91c2VQYXR0ZXJuLmxlbmd0aCk7XG5cdFx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KHttbERhdGE6IGNsZWFuRGF0YX0pO1xuXHR9O1xuPC9zY3JpcHQ+XG5cblxuXG5cblxuPHN0eWxlPlxuLyoqXG4qIEZMQVRcbioqL1xuI0pTRS1DYXB0Y2hhLmZsYXQge1xuXHRiYWNrZ3JvdW5kOiBub25lO1xuXHRwYWRkaW5nOiAwcHg7XG59XG5cbiNKU0UtQ2FwdGNoYS5mbGF0IGRldGFpbHMge1xuXHRib3gtc2hhZG93OiAwcHggMHB4IDBweCA0cHggcmdiYSgwLCAwLCAwLCAwLjA2KTtcbn1cblxuLyoqKiovXG5cblxuLyoqXG4qIFNNQUxMXG4qKi9cbiNKU0UtQ2FwdGNoYS5TIHtcblx0Ym9yZGVyLXJhZGl1czogNnB4O1xuXHRwYWRkaW5nOiA4cHg7XG5cdG1hcmdpbjogNXB4O1xuXHRmb250LXNpemU6IDExcHg7XG59XG5cbiNKU0UtQ2FwdGNoYS5TICNKU0UtaW5wdXQge1xuXHRoZWlnaHQ6IDIwcHg7XG5cdG1pbi13aWR0aDogMjBweDtcblx0Zm9udC1zaXplOiAxNXB4O1xuXHRib3JkZXI6IHNvbGlkIDFweCAjRDNEOEREO1xuXHRwYWRkaW5nOiAycHg7XG5cdG1hcmdpbjogNnB4O1xufVxuXG4jSlNFLUNhcHRjaGEuUyAjSlNFLWJyYW5kIHtcblx0d2lkdGg6IDMwcHg7XG5cdGJvcmRlci1sZWZ0OiBzb2xpZCAycHggI0Y5RjlGOTtcbn1cblxuI0pTRS1DYXB0Y2hhLlMgI0pTRS1icmFuZCBzdmcge1xuXHR3aWR0aDogMjRweDtcbn1cblxuI0pTRS1DYXB0Y2hhLlMuZmxhdCBkZXRhaWxzIHtcblx0Ym94LXNoYWRvdzogMHB4IDBweCAwcHggMnB4IHJnYmEoMCwgMCwgMCwgMC4wNik7XG59XG5cbi8qKioqL1xuXG4vKipcbiogTUVESVVNXG4qKi9cbiNKU0UtQ2FwdGNoYS5NIHtcblx0Ym9yZGVyLXJhZGl1czogNnB4O1xuXHRwYWRkaW5nOiA4cHg7XG5cdG1hcmdpbjogNXB4O1xuXHRmb250LXNpemU6IDE2cHg7XG59XG5cbiNKU0UtQ2FwdGNoYS5NICNKU0UtaW5wdXQge1xuXHRoZWlnaHQ6IDMwcHg7XG5cdG1pbi13aWR0aDogMzBweDtcblx0Zm9udC1zaXplOiAyMnB4O1xuXHRib3JkZXI6IHNvbGlkIDJweCAjRDNEOEREO1xuXHRtYXJnaW46IDhweDtcbn1cblxuI0pTRS1DYXB0Y2hhLk0gI0pTRS1icmFuZCB7XG5cdHdpZHRoOiAzOHB4O1xuXHRib3JkZXItbGVmdDogc29saWQgMnB4ICNGOUY5Rjk7XG5cbn1cblxuI0pTRS1DYXB0Y2hhLk0gI0pTRS1icmFuZCBzdmcge1xuXHR3aWR0aDogMzRweDtcblx0bWFyZ2luLXRvcDogNHB4O1xufVxuXG4jSlNFLUNhcHRjaGEuTS5mbGF0IGRldGFpbHMge1xuXHRib3gtc2hhZG93OiAwcHggMHB4IDBweCAycHggcmdiYSgwLCAwLCAwLCAwLjA2KTtcbn1cblxuLyoqKiovXG5cbi8qKlxuKiBMQVJHRVxuKiovXG4jSlNFLUNhcHRjaGEuTCB7fVxuOmdsb2JhbCgjSlNFLUNhcHRjaGEuTCBpbnB1dCNjYXB0Y2hhQ2hlY2spIHtcblx0d2lkdGg6MzBweDtcblx0aGVpZ2h0OjMwcHg7XG5cdG1hcmdpbjoxMHB4O1xufVxuLyoqKiovXG5cblxuLyoqXG4qIEJBU0VcbioqL1xuI0pTRS1DYXB0Y2hhIHtcblx0ZGlzcGxheTpub25lO1xuXHRiYWNrZ3JvdW5kOiAjRjJGOEZGO1xuXHRib3JkZXItcmFkaXVzOiA2cHg7XG5cdGNsZWFyOiBib3RoO1xuXHRwYWRkaW5nOiAxM3B4O1xuXHRtYXJnaW46IDEwcHg7XG5cdG1pbi13aWR0aDogMjAwcHg7XG5cdG1heC13aWR0aDogMzE0cHg7XG5cdGNvbG9yOiAjNzA3MDcwO1xuXHRmb250LXNpemU6IDIwcHg7XG5cdGZvbnQtZmFtaWx5OiAnTW9udHNlcnJhdCcsIHNhbnMtc2VyaWY7XG59XG5cbiNKU0UtQ2FwdGNoYSAqIHtcblx0LXdlYmtpdC11c2VyLXNlbGVjdDogbm9uZTtcblx0ICAgLW1vei11c2VyLXNlbGVjdDogbm9uZTtcblx0ICAgIC1tcy11c2VyLXNlbGVjdDogbm9uZTtcblx0ICAgICAgICB1c2VyLXNlbGVjdDogbm9uZTtcbn1cblxuI0pTRS1DYXB0Y2hhIGRldGFpbHMge1xuXHRvdmVyZmxvdzogaGlkZGVuO1xuXHRtYXJnaW46IDBweDtcblx0YmFja2dyb3VuZDogI2ZmZjtcblx0Ym9yZGVyLXJhZGl1czogNHB4O1xuXHRib3gtc2hhZG93OiAwcHggM3B4IDZweCAwcHggcmdiYSgwLCAwLCAwLCAwLjEyKTtcbn1cblxuI0pTRS1DYXB0Y2hhIGRldGFpbHMgc3VtbWFyeSB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdG91dGxpbmU6IG5vbmU7XG59XG5cbiNKU0UtQ2FwdGNoYSBkZXRhaWxzICNKU0UtQ2FwdGNoYURpc3BsYXkge1xuXHRvcGFjaXR5OiAwO1xuXHRtYXJnaW46IDBweDtcblx0cGFkZGluZzogMHB4O1xuXHRoZWlnaHQ6IDBweDtcblx0dHJhbnNpdGlvbjogb3BhY2l0eSAwLjJzLCBoZWlnaHQgMC40cztcblx0YmFja2dyb3VuZDogI2ZmZjtcbn1cblxuI0pTRS1DYXB0Y2hhIGRldGFpbHMuY2FwdGNoYVBhbmVsW29wZW5dICNKU0UtQ2FwdGNoYURpc3BsYXkge1xuXHQtd2Via2l0LWFuaW1hdGlvbi1uYW1lOiBzbGlkZURvd247XG5cdCAgICAgICAgYW5pbWF0aW9uLW5hbWU6IHNsaWRlRG93bjtcblx0LXdlYmtpdC1hbmltYXRpb24tZHVyYXRpb246IDAuM3M7XG5cdCAgICAgICAgYW5pbWF0aW9uLWR1cmF0aW9uOiAwLjNzO1xuXHQtd2Via2l0LWFuaW1hdGlvbi1maWxsLW1vZGU6IGZvcndhcmRzO1xuXHQgICAgICAgIGFuaW1hdGlvbi1maWxsLW1vZGU6IGZvcndhcmRzO1xuXHQtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogMC4zcztcblx0ICAgICAgICBhbmltYXRpb24tZGVsYXk6IDAuM3M7XG59XG5cbiNKU0UtQ2FwdGNoYSAjSlNFLWlucHV0IHtcblx0Ym9yZGVyOiBzb2xpZCA0cHggI0QzRDhERDtcblx0Ym9yZGVyLXJhZGl1czogNHB4O1xuXHRtYXJnaW46IDEwcHg7XG5cdG1pbi13aWR0aDogNDBweDtcblx0aGVpZ2h0OiA0MHB4O1xuXHRjdXJzb3I6IHBvaW50ZXI7XG5cdGZvbnQtc2l6ZTogMjhweDtcblx0dGV4dC1hbGlnbjogY2VudGVyO1xuXHRwb3NpdGlvbjogcmVsYXRpdmU7XG5cdG92ZXJmbG93OiBoaWRkZW47XG59XG5cbiNKU0UtQ2FwdGNoYSBkZXRhaWxzPnN1bW1hcnk6Oi13ZWJraXQtZGV0YWlscy1tYXJrZXIge1xuXHRkaXNwbGF5OiBub25lO1xufVxuXG4jSlNFLUNhcHRjaGEgZGV0YWlscyAjSlNFLWlucHV0OmhvdmVyOmJlZm9yZSB7XG5cdGNvbnRlbnQ6ICfwn6SWJztcblx0b3BhY2l0eTogMTtcbn1cblxuI0pTRS1DYXB0Y2hhLnN1Y2Nlc3MgZGV0YWlscyAjSlNFLWlucHV0OmJlZm9yZSB7XG5cdGNvbnRlbnQ6ICfwn5iJJztcblx0b3BhY2l0eTogMTtcbn1cblxuI0pTRS1DYXB0Y2hhLnN1Y2Nlc3MgZGV0YWlscyAjSlNFLWlucHV0OmFmdGVyIHtcblx0Y29udGVudDogJ+KclCc7XG5cdG9wYWNpdHk6IDE7XG5cdGNvbG9yOiAjMjZBRTYwO1xuXHRwYWRkaW5nOiAwcHggNHB4IDBweCA1cHg7XG5cdGJvcmRlci1sZWZ0OiBzb2xpZCAycHggI0QzRDhERDtcbn1cblxuXG4jSlNFLUNhcHRjaGEuc3VjY2VzcyBkZXRhaWxzLmNhcHRjaGFQYW5lbFtvcGVuXSAjSlNFLWlucHV0OmFmdGVyIHtcblx0Y29udGVudDogJyc7XG5cdG9wYWNpdHk6IDA7XG5cdHBhZGRpbmc6IDBweDtcblx0Ym9yZGVyOiAwcHg7XG5cdFxufVxuXG4jSlNFLUNhcHRjaGEgZGV0YWlscyAjSlNFLWlucHV0OmJlZm9yZSxcbiNKU0UtQ2FwdGNoYSBkZXRhaWxzLmNhcHRjaGFQYW5lbFtvcGVuXSAjSlNFLWlucHV0OmJlZm9yZSB7XG5cdG9wYWNpdHk6IDA7XG5cdC8qZm9udC1zaXplOiAyOHB4OyovXG5cdGNvbnRlbnQ6ICfwn6SWJztcblx0dHJhbnNpdGlvbjogb3BhY2l0eSAwLjJzO1xuXHRwb3NpdGlvbjogYWJzb2x1dGU7XG5cdHRvcDowcHg7XG5cdGxlZnQ6MHB4O1xuXHRib3R0b206MHB4O1xuXHRyaWdodDowcHg7XG5cdGJhY2tncm91bmQ6I2ZmZjtcbn1cbiNKU0UtQ2FwdGNoYS5zdWNjZXNzIGRldGFpbHMuY2FwdGNoYVBhbmVsICNKU0UtaW5wdXQ6YmVmb3JlIHtcblx0cmlnaHQ6NTAlO1xufVxuI0pTRS1DYXB0Y2hhLnN1Y2Nlc3MgZGV0YWlscy5jYXB0Y2hhUGFuZWxbb3Blbl0gI0pTRS1pbnB1dDphZnRlciB7XG5cdGRpc3BsYXk6IG5vbmU7XG59XG4jSlNFLUNhcHRjaGEuc3VjY2VzcyBkZXRhaWxzLmNhcHRjaGFQYW5lbCAjSlNFLWlucHV0OmFmdGVyIHtcblx0bGVmdDo1MCU7XG5cdHBvc2l0aW9uOiBhYnNvbHV0ZTtcblx0dG9wOjBweDtcblx0Ym90dG9tOjBweDtcblx0cmlnaHQ6MHB4O1xuXHRiYWNrZ3JvdW5kOiNmZmY7XG59XG4jSlNFLUNhcHRjaGEuc3VjY2VzcyAjSlNFLWlucHV0IHtcblx0bWluLXdpZHRoOjUycHg7XG59XG4jSlNFLUNhcHRjaGEuc3VjY2VzcyBkZXRhaWxzLmNhcHRjaGFQYW5lbFtvcGVuXSAjSlNFLWlucHV0IHtcblx0bWluLXdpZHRoOjIwcHg7XG59XG5cbiNKU0UtQ2FwdGNoYSBkZXRhaWxzLmNhcHRjaGFQYW5lbFtvcGVuXSAjSlNFLWlucHV0OmJlZm9yZSB7XG5cdG9wYWNpdHk6IDE7XG59XG5cbiNKU0UtQ2FwdGNoYSAjSlNFLW1zZyB7XG5cdGFsaWduLXNlbGY6IGNlbnRlcjtcblx0cGFkZGluZzogMHB4IDBweCAwcHggNHB4O1xuXHRmbGV4OiAxO1xufVxuXG4jSlNFLUNhcHRjaGEgI0pTRS1tc2cgcCB7XG5cdHZlcnRpY2FsLWFsaWduOiBib3R0b207XG5cdGRpc3BsYXk6IGlubGluZS1ibG9jaztcblx0bWFyZ2luOiAwcHg7XG5cdGxpbmUtaGVpZ2h0OiAxLjI7XG59XG5cbiNKU0UtQ2FwdGNoYSAjSlNFLWJyYW5kIHtcblx0Ym9yZGVyLWxlZnQ6IHNvbGlkIDNweCAjRjlGOUY5O1xuXHRhbGlnbi1zZWxmOiBjZW50ZXI7XG5cdHdpZHRoOiA2MHB4O1xuXHRwYWRkaW5nOiAwcHggNHB4O1xuXHR0ZXh0LWFsaWduOiBjZW50ZXI7XG59XG5cbiNKU0UtQ2FwdGNoYSAjSlNFLWJyYW5kIHN2ZyB7XG5cdGZpbGw6ICM1MUJGRUM7XG5cdHdpZHRoOiA0OHB4O1xufVxuXG4jSlNFLUNhcHRjaGEgI0pTRS1DYXB0Y2hhRGlzcGxheSAjSlNFLWNhcHRjaGEtZ2FtZS1jb250YWluZXIge1xuXHRiYWNrZ3JvdW5kOiAjRjJGOEZGO1xuXHRib3JkZXItcmFkaXVzOiA2cHg7XG5cdGhlaWdodDogMTAwJTtcblx0cG9zaXRpb246cmVsYXRpdmU7XG5cdG92ZXJmbG93OmhpZGRlbjtcbn1cbiNKU0UtQ2FwdGNoYSAjSlNFLUNhcHRjaGFEaXNwbGF5ICNKU0UtY2FwdGNoYS1nYW1lIHtcblx0aGVpZ2h0OjEwMCU7XG59XG5cblxuQC13ZWJraXQta2V5ZnJhbWVzIHNsaWRlRG93biB7XG5cdGZyb20ge1xuXHRcdG9wYWNpdHk6IDA7XG5cdFx0aGVpZ2h0OiAwO1xuXHRcdHBhZGRpbmc6IDhweDtcblx0XHRib3JkZXItdG9wOiBzb2xpZCA0cHggI0Y5RjlGOTtcblx0fVxuXG5cdHRvIHtcblx0XHRvcGFjaXR5OiAxO1xuXHRcdGhlaWdodDogMTkwcHg7XG5cdFx0cGFkZGluZzogOHB4O1xuXHRcdGJvcmRlci10b3A6IHNvbGlkIDRweCAjRjlGOUY5O1xuXHRcdC8qaGVpZ2h0OiB2YXIoLS1jb250ZW50SGVpZ2h0KTsqL1xuXHR9XG59XG5cblxuQGtleWZyYW1lcyBzbGlkZURvd24ge1xuXHRmcm9tIHtcblx0XHRvcGFjaXR5OiAwO1xuXHRcdGhlaWdodDogMDtcblx0XHRwYWRkaW5nOiA4cHg7XG5cdFx0Ym9yZGVyLXRvcDogc29saWQgNHB4ICNGOUY5Rjk7XG5cdH1cblxuXHR0byB7XG5cdFx0b3BhY2l0eTogMTtcblx0XHRoZWlnaHQ6IDE5MHB4O1xuXHRcdHBhZGRpbmc6IDhweDtcblx0XHRib3JkZXItdG9wOiBzb2xpZCA0cHggI0Y5RjlGOTtcblx0XHQvKmhlaWdodDogdmFyKC0tY29udGVudEhlaWdodCk7Ki9cblx0fVxufVxuXG4jSlNFLUNhcHRjaGEgZGV0YWlscyAjSlNFLW1zZz5wOmFmdGVyIHtcblx0Y29udGVudDogJ0ltIGh1bWFuJztcbn1cblxuI0pTRS1DYXB0Y2hhIGRldGFpbHMuY2FwdGNoYVBhbmVsW29wZW5dICNKU0UtbXNnPnA6YWZ0ZXIsXG4jSlNFLUNhcHRjaGEuc3VjY2VzcyBkZXRhaWxzLmNhcHRjaGFQYW5lbFtvcGVuXSAjSlNFLW1zZz5wOmFmdGVyIHtcblx0Y29udGVudDogJ0ltIG5vdCBhIHJvYm90Jztcbn1cblxuI0pTRS1DYXB0Y2hhLnN1Y2Nlc3MgZGV0YWlscyAjSlNFLW1zZz5wOmFmdGVyIHtcblx0Y29udGVudDogJ1ZlcmlmaWVkIGh1bWFuJztcbn1cblxuI0pTRS1pbnB1dCBpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl0ge1xuXHQvKnBvc2l0aW9uOiBhYnNvbHV0ZTtcblx0dG9wOiAtNTBweDsqL1xufVxuI0pTRS1DYXB0Y2hhLmFjdGl2ZSB7XG5cdGRpc3BsYXk6YmxvY2s7XG59XG4vKioqKi9cblxuLyojIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYkluTnlZeTlqYjIxd2IyNWxiblJ6TDBwVFJVTmhjSFJqYUdFdWMzWmxiSFJsSWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUk3UVVGRFFUczdSVUZGUlR0QlFVTkdPME5CUTBNc1owSkJRV2RDTzBOQlEyaENMRmxCUVZrN1FVRkRZanM3UVVGRlFUdERRVU5ETEN0RFFVRXJRenRCUVVOb1JEczdRVUZGUVN4TFFVRkxPenM3UVVGSFREczdSVUZGUlR0QlFVTkdPME5CUTBNc2EwSkJRV3RDTzBOQlEyeENMRmxCUVZrN1EwRkRXaXhYUVVGWE8wTkJRMWdzWlVGQlpUdEJRVU5vUWpzN1FVRkZRVHREUVVORExGbEJRVms3UTBGRFdpeGxRVUZsTzBOQlEyWXNaVUZCWlR0RFFVTm1MSGxDUVVGNVFqdERRVU42UWl4WlFVRlpPME5CUTFvc1YwRkJWenRCUVVOYU96dEJRVVZCTzBOQlEwTXNWMEZCVnp0RFFVTllMRGhDUVVFNFFqdEJRVU12UWpzN1FVRkZRVHREUVVORExGZEJRVmM3UVVGRFdqczdRVUZGUVR0RFFVTkRMQ3REUVVFclF6dEJRVU5vUkRzN1FVRkZRU3hMUVVGTE96dEJRVVZNT3p0RlFVVkZPMEZCUTBZN1EwRkRReXhyUWtGQmEwSTdRMEZEYkVJc1dVRkJXVHREUVVOYUxGZEJRVmM3UTBGRFdDeGxRVUZsTzBGQlEyaENPenRCUVVWQk8wTkJRME1zV1VGQldUdERRVU5hTEdWQlFXVTdRMEZEWml4bFFVRmxPME5CUTJZc2VVSkJRWGxDTzBOQlEzcENMRmRCUVZjN1FVRkRXanM3UVVGRlFUdERRVU5ETEZkQlFWYzdRMEZEV0N3NFFrRkJPRUk3TzBGQlJTOUNPenRCUVVWQk8wTkJRME1zVjBGQlZ6dERRVU5ZTEdWQlFXVTdRVUZEYUVJN08wRkJSVUU3UTBGRFF5d3JRMEZCSzBNN1FVRkRhRVE3TzBGQlJVRXNTMEZCU3pzN1FVRkZURHM3UlVGRlJUdEJRVU5HTEdkQ1FVRm5RanRCUVVOb1FqdERRVU5ETEZWQlFWVTdRMEZEVml4WFFVRlhPME5CUTFnc1YwRkJWenRCUVVOYU8wRkJRMEVzUzBGQlN6czdPMEZCUjB3N08wVkJSVVU3UVVGRFJqdERRVU5ETEZsQlFWazdRMEZEV2l4dFFrRkJiVUk3UTBGRGJrSXNhMEpCUVd0Q08wTkJRMnhDTEZkQlFWYzdRMEZEV0N4aFFVRmhPME5CUTJJc1dVRkJXVHREUVVOYUxHZENRVUZuUWp0RFFVTm9RaXhuUWtGQlowSTdRMEZEYUVJc1kwRkJZenREUVVOa0xHVkJRV1U3UTBGRFppeHhRMEZCY1VNN1FVRkRkRU03TzBGQlJVRTdRMEZEUXl4NVFrRkJhVUk3U1VGQmFrSXNjMEpCUVdsQ08wdEJRV3BDTEhGQ1FVRnBRanRUUVVGcVFpeHBRa0ZCYVVJN1FVRkRiRUk3TzBGQlJVRTdRMEZEUXl4blFrRkJaMEk3UTBGRGFFSXNWMEZCVnp0RFFVTllMR2RDUVVGblFqdERRVU5vUWl4clFrRkJhMEk3UTBGRGJFSXNLME5CUVN0RE8wRkJRMmhFT3p0QlFVVkJPME5CUTBNc1lVRkJZVHREUVVOaUxHRkJRV0U3UVVGRFpEczdRVUZGUVR0RFFVTkRMRlZCUVZVN1EwRkRWaXhYUVVGWE8wTkJRMWdzV1VGQldUdERRVU5hTEZkQlFWYzdRMEZEV0N4eFEwRkJjVU03UTBGRGNrTXNaMEpCUVdkQ08wRkJRMnBDT3p0QlFVVkJPME5CUTBNc2FVTkJRWGxDTzFOQlFYcENMSGxDUVVGNVFqdERRVU42UWl4blEwRkJkMEk3VTBGQmVFSXNkMEpCUVhkQ08wTkJRM2hDTEhGRFFVRTJRanRUUVVFM1FpdzJRa0ZCTmtJN1EwRkROMElzTmtKQlFYRkNPMU5CUVhKQ0xIRkNRVUZ4UWp0QlFVTjBRanM3UVVGRlFUdERRVU5ETEhsQ1FVRjVRanREUVVONlFpeHJRa0ZCYTBJN1EwRkRiRUlzV1VGQldUdERRVU5hTEdWQlFXVTdRMEZEWml4WlFVRlpPME5CUTFvc1pVRkJaVHREUVVObUxHVkJRV1U3UTBGRFppeHJRa0ZCYTBJN1EwRkRiRUlzYTBKQlFXdENPME5CUTJ4Q0xHZENRVUZuUWp0QlFVTnFRanM3UVVGRlFUdERRVU5ETEdGQlFXRTdRVUZEWkRzN1FVRkZRVHREUVVORExHRkJRV0U3UTBGRFlpeFZRVUZWTzBGQlExZzdPMEZCUlVFN1EwRkRReXhoUVVGaE8wTkJRMklzVlVGQlZUdEJRVU5ZT3p0QlFVVkJPME5CUTBNc1dVRkJXVHREUVVOYUxGVkJRVlU3UTBGRFZpeGpRVUZqTzBOQlEyUXNkMEpCUVhkQ08wTkJRM2hDTERoQ1FVRTRRanRCUVVNdlFqczdPMEZCUjBFN1EwRkRReXhYUVVGWE8wTkJRMWdzVlVGQlZUdERRVU5XTEZsQlFWazdRMEZEV2l4WFFVRlhPenRCUVVWYU96dEJRVVZCT3p0RFFVVkRMRlZCUVZVN1EwRkRWaXh0UWtGQmJVSTdRMEZEYmtJc1lVRkJZVHREUVVOaUxIZENRVUYzUWp0RFFVTjRRaXhyUWtGQmEwSTdRMEZEYkVJc1QwRkJUenREUVVOUUxGRkJRVkU3UTBGRFVpeFZRVUZWTzBOQlExWXNVMEZCVXp0RFFVTlVMR1ZCUVdVN1FVRkRhRUk3UVVGRFFUdERRVU5ETEZOQlFWTTdRVUZEVmp0QlFVTkJPME5CUTBNc1lVRkJZVHRCUVVOa08wRkJRMEU3UTBGRFF5eFJRVUZSTzBOQlExSXNhMEpCUVd0Q08wTkJRMnhDTEU5QlFVODdRMEZEVUN4VlFVRlZPME5CUTFZc1UwRkJVenREUVVOVUxHVkJRV1U3UVVGRGFFSTdRVUZEUVR0RFFVTkRMR05CUVdNN1FVRkRaanRCUVVOQk8wTkJRME1zWTBGQll6dEJRVU5tT3p0QlFVVkJPME5CUTBNc1ZVRkJWVHRCUVVOWU96dEJRVVZCTzBOQlEwTXNhMEpCUVd0Q08wTkJRMnhDTEhkQ1FVRjNRanREUVVONFFpeFBRVUZQTzBGQlExSTdPMEZCUlVFN1EwRkRReXh6UWtGQmMwSTdRMEZEZEVJc2NVSkJRWEZDTzBOQlEzSkNMRmRCUVZjN1EwRkRXQ3huUWtGQlowSTdRVUZEYWtJN08wRkJSVUU3UTBGRFF5dzRRa0ZCT0VJN1EwRkRPVUlzYTBKQlFXdENPME5CUTJ4Q0xGZEJRVmM3UTBGRFdDeG5Ra0ZCWjBJN1EwRkRhRUlzYTBKQlFXdENPMEZCUTI1Q096dEJRVVZCTzBOQlEwTXNZVUZCWVR0RFFVTmlMRmRCUVZjN1FVRkRXanM3UVVGRlFUdERRVU5ETEcxQ1FVRnRRanREUVVOdVFpeHJRa0ZCYTBJN1EwRkRiRUlzV1VGQldUdERRVU5hTEdsQ1FVRnBRanREUVVOcVFpeGxRVUZsTzBGQlEyaENPMEZCUTBFN1EwRkRReXhYUVVGWE8wRkJRMW83T3p0QlFVZEJPME5CUTBNN1JVRkRReXhWUVVGVk8wVkJRMVlzVTBGQlV6dEZRVU5VTEZsQlFWazdSVUZEV2l3MlFrRkJOa0k3UTBGRE9VSTdPME5CUlVFN1JVRkRReXhWUVVGVk8wVkJRMVlzWVVGQllUdEZRVU5pTEZsQlFWazdSVUZEV2l3MlFrRkJOa0k3UlVGRE4wSXNaME5CUVdkRE8wTkJRMnBETzBGQlEwUTdPenRCUVdaQk8wTkJRME03UlVGRFF5eFZRVUZWTzBWQlExWXNVMEZCVXp0RlFVTlVMRmxCUVZrN1JVRkRXaXcyUWtGQk5rSTdRMEZET1VJN08wTkJSVUU3UlVGRFF5eFZRVUZWTzBWQlExWXNZVUZCWVR0RlFVTmlMRmxCUVZrN1JVRkRXaXcyUWtGQk5rSTdSVUZETjBJc1owTkJRV2RETzBOQlEycERPMEZCUTBRN08wRkJSVUU3UTBGRFF5eHRRa0ZCYlVJN1FVRkRjRUk3TzBGQlJVRTdPME5CUlVNc2VVSkJRWGxDTzBGQlF6RkNPenRCUVVWQk8wTkJRME1zZVVKQlFYbENPMEZCUXpGQ096dEJRVVZCTzBOQlEwTTdZVUZEV1R0QlFVTmlPMEZCUTBFN1EwRkRReXhoUVVGaE8wRkJRMlE3UVVGRFFTeExRVUZMSWl3aVptbHNaU0k2SW5OeVl5OWpiMjF3YjI1bGJuUnpMMHBUUlVOaGNIUmphR0V1YzNabGJIUmxJaXdpYzI5MWNtTmxjME52Ym5SbGJuUWlPbHNpWEc0dktpcGNiaW9nUmt4QlZGeHVLaW92WEc0alNsTkZMVU5oY0hSamFHRXVabXhoZENCN1hHNWNkR0poWTJ0bmNtOTFibVE2SUc1dmJtVTdYRzVjZEhCaFpHUnBibWM2SURCd2VEdGNibjFjYmx4dUkwcFRSUzFEWVhCMFkyaGhMbVpzWVhRZ1pHVjBZV2xzY3lCN1hHNWNkR0p2ZUMxemFHRmtiM2M2SURCd2VDQXdjSGdnTUhCNElEUndlQ0J5WjJKaEtEQXNJREFzSURBc0lEQXVNRFlwTzF4dWZWeHVYRzR2S2lvcUtpOWNibHh1WEc0dktpcGNiaW9nVTAxQlRFeGNiaW9xTDF4dUkwcFRSUzFEWVhCMFkyaGhMbE1nZTF4dVhIUmliM0prWlhJdGNtRmthWFZ6T2lBMmNIZzdYRzVjZEhCaFpHUnBibWM2SURod2VEdGNibHgwYldGeVoybHVPaUExY0hnN1hHNWNkR1p2Ym5RdGMybDZaVG9nTVRGd2VEdGNibjFjYmx4dUkwcFRSUzFEWVhCMFkyaGhMbE1nSTBwVFJTMXBibkIxZENCN1hHNWNkR2hsYVdkb2REb2dNakJ3ZUR0Y2JseDBiV2x1TFhkcFpIUm9PaUF5TUhCNE8xeHVYSFJtYjI1MExYTnBlbVU2SURFMWNIZzdYRzVjZEdKdmNtUmxjam9nYzI5c2FXUWdNWEI0SUNORU0wUTRSRVE3WEc1Y2RIQmhaR1JwYm1jNklESndlRHRjYmx4MGJXRnlaMmx1T2lBMmNIZzdYRzU5WEc1Y2JpTktVMFV0UTJGd2RHTm9ZUzVUSUNOS1UwVXRZbkpoYm1RZ2UxeHVYSFIzYVdSMGFEb2dNekJ3ZUR0Y2JseDBZbTl5WkdWeUxXeGxablE2SUhOdmJHbGtJREp3ZUNBalJqbEdPVVk1TzF4dWZWeHVYRzRqU2xORkxVTmhjSFJqYUdFdVV5QWpTbE5GTFdKeVlXNWtJSE4yWnlCN1hHNWNkSGRwWkhSb09pQXlOSEI0TzF4dWZWeHVYRzRqU2xORkxVTmhjSFJqYUdFdVV5NW1iR0YwSUdSbGRHRnBiSE1nZTF4dVhIUmliM2d0YzJoaFpHOTNPaUF3Y0hnZ01IQjRJREJ3ZUNBeWNIZ2djbWRpWVNnd0xDQXdMQ0F3TENBd0xqQTJLVHRjYm4xY2JseHVMeW9xS2lvdlhHNWNiaThxS2x4dUtpQk5SVVJKVlUxY2Jpb3FMMXh1STBwVFJTMURZWEIwWTJoaExrMGdlMXh1WEhSaWIzSmtaWEl0Y21Ga2FYVnpPaUEyY0hnN1hHNWNkSEJoWkdScGJtYzZJRGh3ZUR0Y2JseDBiV0Z5WjJsdU9pQTFjSGc3WEc1Y2RHWnZiblF0YzJsNlpUb2dNVFp3ZUR0Y2JuMWNibHh1STBwVFJTMURZWEIwWTJoaExrMGdJMHBUUlMxcGJuQjFkQ0I3WEc1Y2RHaGxhV2RvZERvZ016QndlRHRjYmx4MGJXbHVMWGRwWkhSb09pQXpNSEI0TzF4dVhIUm1iMjUwTFhOcGVtVTZJREl5Y0hnN1hHNWNkR0p2Y21SbGNqb2djMjlzYVdRZ01uQjRJQ05FTTBRNFJFUTdYRzVjZEcxaGNtZHBiam9nT0hCNE8xeHVmVnh1WEc0alNsTkZMVU5oY0hSamFHRXVUU0FqU2xORkxXSnlZVzVrSUh0Y2JseDBkMmxrZEdnNklETTRjSGc3WEc1Y2RHSnZjbVJsY2kxc1pXWjBPaUJ6YjJ4cFpDQXljSGdnSTBZNVJqbEdPVHRjYmx4dWZWeHVYRzRqU2xORkxVTmhjSFJqYUdFdVRTQWpTbE5GTFdKeVlXNWtJSE4yWnlCN1hHNWNkSGRwWkhSb09pQXpOSEI0TzF4dVhIUnRZWEpuYVc0dGRHOXdPaUEwY0hnN1hHNTlYRzVjYmlOS1UwVXRRMkZ3ZEdOb1lTNU5MbVpzWVhRZ1pHVjBZV2xzY3lCN1hHNWNkR0p2ZUMxemFHRmtiM2M2SURCd2VDQXdjSGdnTUhCNElESndlQ0J5WjJKaEtEQXNJREFzSURBc0lEQXVNRFlwTzF4dWZWeHVYRzR2S2lvcUtpOWNibHh1THlvcVhHNHFJRXhCVWtkRlhHNHFLaTljYmlOS1UwVXRRMkZ3ZEdOb1lTNU1JSHQ5WEc0NloyeHZZbUZzS0NOS1UwVXRRMkZ3ZEdOb1lTNU1JR2x1Y0hWMEkyTmhjSFJqYUdGRGFHVmpheWtnZTF4dVhIUjNhV1IwYURvek1IQjRPMXh1WEhSb1pXbG5hSFE2TXpCd2VEdGNibHgwYldGeVoybHVPakV3Y0hnN1hHNTlYRzR2S2lvcUtpOWNibHh1WEc0dktpcGNiaW9nUWtGVFJWeHVLaW92WEc0alNsTkZMVU5oY0hSamFHRWdlMXh1WEhSa2FYTndiR0Y1T201dmJtVTdYRzVjZEdKaFkydG5jbTkxYm1RNklDTkdNa1k0UmtZN1hHNWNkR0p2Y21SbGNpMXlZV1JwZFhNNklEWndlRHRjYmx4MFkyeGxZWEk2SUdKdmRHZzdYRzVjZEhCaFpHUnBibWM2SURFemNIZzdYRzVjZEcxaGNtZHBiam9nTVRCd2VEdGNibHgwYldsdUxYZHBaSFJvT2lBeU1EQndlRHRjYmx4MGJXRjRMWGRwWkhSb09pQXpNVFJ3ZUR0Y2JseDBZMjlzYjNJNklDTTNNRGN3TnpBN1hHNWNkR1p2Ym5RdGMybDZaVG9nTWpCd2VEdGNibHgwWm05dWRDMW1ZVzFwYkhrNklDZE5iMjUwYzJWeWNtRjBKeXdnYzJGdWN5MXpaWEpwWmp0Y2JuMWNibHh1STBwVFJTMURZWEIwWTJoaElDb2dlMXh1WEhSMWMyVnlMWE5sYkdWamREb2dibTl1WlR0Y2JuMWNibHh1STBwVFJTMURZWEIwWTJoaElHUmxkR0ZwYkhNZ2UxeHVYSFJ2ZG1WeVpteHZkem9nYUdsa1pHVnVPMXh1WEhSdFlYSm5hVzQ2SURCd2VEdGNibHgwWW1GamEyZHliM1Z1WkRvZ0kyWm1aanRjYmx4MFltOXlaR1Z5TFhKaFpHbDFjem9nTkhCNE8xeHVYSFJpYjNndGMyaGhaRzkzT2lBd2NIZ2dNM0I0SURad2VDQXdjSGdnY21kaVlTZ3dMQ0F3TENBd0xDQXdMakV5S1R0Y2JuMWNibHh1STBwVFJTMURZWEIwWTJoaElHUmxkR0ZwYkhNZ2MzVnRiV0Z5ZVNCN1hHNWNkR1JwYzNCc1lYazZJR1pzWlhnN1hHNWNkRzkxZEd4cGJtVTZJRzV2Ym1VN1hHNTlYRzVjYmlOS1UwVXRRMkZ3ZEdOb1lTQmtaWFJoYVd4eklDTktVMFV0UTJGd2RHTm9ZVVJwYzNCc1lYa2dlMXh1WEhSdmNHRmphWFI1T2lBd08xeHVYSFJ0WVhKbmFXNDZJREJ3ZUR0Y2JseDBjR0ZrWkdsdVp6b2dNSEI0TzF4dVhIUm9aV2xuYUhRNklEQndlRHRjYmx4MGRISmhibk5wZEdsdmJqb2diM0JoWTJsMGVTQXdMakp6TENCb1pXbG5hSFFnTUM0MGN6dGNibHgwWW1GamEyZHliM1Z1WkRvZ0kyWm1aanRjYm4xY2JseHVJMHBUUlMxRFlYQjBZMmhoSUdSbGRHRnBiSE11WTJGd2RHTm9ZVkJoYm1Wc1cyOXdaVzVkSUNOS1UwVXRRMkZ3ZEdOb1lVUnBjM0JzWVhrZ2UxeHVYSFJoYm1sdFlYUnBiMjR0Ym1GdFpUb2djMnhwWkdWRWIzZHVPMXh1WEhSaGJtbHRZWFJwYjI0dFpIVnlZWFJwYjI0NklEQXVNM003WEc1Y2RHRnVhVzFoZEdsdmJpMW1hV3hzTFcxdlpHVTZJR1p2Y25kaGNtUnpPMXh1WEhSaGJtbHRZWFJwYjI0dFpHVnNZWGs2SURBdU0zTTdYRzU5WEc1Y2JpTktVMFV0UTJGd2RHTm9ZU0FqU2xORkxXbHVjSFYwSUh0Y2JseDBZbTl5WkdWeU9pQnpiMnhwWkNBMGNIZ2dJMFF6UkRoRVJEdGNibHgwWW05eVpHVnlMWEpoWkdsMWN6b2dOSEI0TzF4dVhIUnRZWEpuYVc0NklERXdjSGc3WEc1Y2RHMXBiaTEzYVdSMGFEb2dOREJ3ZUR0Y2JseDBhR1ZwWjJoME9pQTBNSEI0TzF4dVhIUmpkWEp6YjNJNklIQnZhVzUwWlhJN1hHNWNkR1p2Ym5RdGMybDZaVG9nTWpod2VEdGNibHgwZEdWNGRDMWhiR2xuYmpvZ1kyVnVkR1Z5TzF4dVhIUndiM05wZEdsdmJqb2djbVZzWVhScGRtVTdYRzVjZEc5MlpYSm1iRzkzT2lCb2FXUmtaVzQ3WEc1OVhHNWNiaU5LVTBVdFEyRndkR05vWVNCa1pYUmhhV3h6UG5OMWJXMWhjbms2T2kxM1pXSnJhWFF0WkdWMFlXbHNjeTF0WVhKclpYSWdlMXh1WEhSa2FYTndiR0Y1T2lCdWIyNWxPMXh1ZlZ4dVhHNGpTbE5GTFVOaGNIUmphR0VnWkdWMFlXbHNjeUFqU2xORkxXbHVjSFYwT21odmRtVnlPbUpsWm05eVpTQjdYRzVjZEdOdmJuUmxiblE2SUNmd242U1dKenRjYmx4MGIzQmhZMmwwZVRvZ01UdGNibjFjYmx4dUkwcFRSUzFEWVhCMFkyaGhMbk4xWTJObGMzTWdaR1YwWVdsc2N5QWpTbE5GTFdsdWNIVjBPbUpsWm05eVpTQjdYRzVjZEdOdmJuUmxiblE2SUNmd241aUpKenRjYmx4MGIzQmhZMmwwZVRvZ01UdGNibjFjYmx4dUkwcFRSUzFEWVhCMFkyaGhMbk4xWTJObGMzTWdaR1YwWVdsc2N5QWpTbE5GTFdsdWNIVjBPbUZtZEdWeUlIdGNibHgwWTI5dWRHVnVkRG9nSitLY2xDYzdYRzVjZEc5d1lXTnBkSGs2SURFN1hHNWNkR052Ykc5eU9pQWpNalpCUlRZd08xeHVYSFJ3WVdSa2FXNW5PaUF3Y0hnZ05IQjRJREJ3ZUNBMWNIZzdYRzVjZEdKdmNtUmxjaTFzWldaME9pQnpiMnhwWkNBeWNIZ2dJMFF6UkRoRVJEdGNibjFjYmx4dVhHNGpTbE5GTFVOaGNIUmphR0V1YzNWalkyVnpjeUJrWlhSaGFXeHpMbU5oY0hSamFHRlFZVzVsYkZ0dmNHVnVYU0FqU2xORkxXbHVjSFYwT21GbWRHVnlJSHRjYmx4MFkyOXVkR1Z1ZERvZ0p5YzdYRzVjZEc5d1lXTnBkSGs2SURBN1hHNWNkSEJoWkdScGJtYzZJREJ3ZUR0Y2JseDBZbTl5WkdWeU9pQXdjSGc3WEc1Y2RGeHVmVnh1WEc0alNsTkZMVU5oY0hSamFHRWdaR1YwWVdsc2N5QWpTbE5GTFdsdWNIVjBPbUpsWm05eVpTeGNiaU5LVTBVdFEyRndkR05vWVNCa1pYUmhhV3h6TG1OaGNIUmphR0ZRWVc1bGJGdHZjR1Z1WFNBalNsTkZMV2x1Y0hWME9tSmxabTl5WlNCN1hHNWNkRzl3WVdOcGRIazZJREE3WEc1Y2RDOHFabTl1ZEMxemFYcGxPaUF5T0hCNE95b3ZYRzVjZEdOdmJuUmxiblE2SUNmd242U1dKenRjYmx4MGRISmhibk5wZEdsdmJqb2diM0JoWTJsMGVTQXdMakp6TzF4dVhIUndiM05wZEdsdmJqb2dZV0p6YjJ4MWRHVTdYRzVjZEhSdmNEb3djSGc3WEc1Y2RHeGxablE2TUhCNE8xeHVYSFJpYjNSMGIyMDZNSEI0TzF4dVhIUnlhV2RvZERvd2NIZzdYRzVjZEdKaFkydG5jbTkxYm1RNkkyWm1aanRjYm4xY2JpTktVMFV0UTJGd2RHTm9ZUzV6ZFdOalpYTnpJR1JsZEdGcGJITXVZMkZ3ZEdOb1lWQmhibVZzSUNOS1UwVXRhVzV3ZFhRNlltVm1iM0psSUh0Y2JseDBjbWxuYUhRNk5UQWxPMXh1ZlZ4dUkwcFRSUzFEWVhCMFkyaGhMbk4xWTJObGMzTWdaR1YwWVdsc2N5NWpZWEIwWTJoaFVHRnVaV3hiYjNCbGJsMGdJMHBUUlMxcGJuQjFkRHBoWm5SbGNpQjdYRzVjZEdScGMzQnNZWGs2SUc1dmJtVTdYRzU5WEc0alNsTkZMVU5oY0hSamFHRXVjM1ZqWTJWemN5QmtaWFJoYVd4ekxtTmhjSFJqYUdGUVlXNWxiQ0FqU2xORkxXbHVjSFYwT21GbWRHVnlJSHRjYmx4MGJHVm1kRG8xTUNVN1hHNWNkSEJ2YzJsMGFXOXVPaUJoWW5OdmJIVjBaVHRjYmx4MGRHOXdPakJ3ZUR0Y2JseDBZbTkwZEc5dE9qQndlRHRjYmx4MGNtbG5hSFE2TUhCNE8xeHVYSFJpWVdOclozSnZkVzVrT2lObVptWTdYRzU5WEc0alNsTkZMVU5oY0hSamFHRXVjM1ZqWTJWemN5QWpTbE5GTFdsdWNIVjBJSHRjYmx4MGJXbHVMWGRwWkhSb09qVXljSGc3WEc1OVhHNGpTbE5GTFVOaGNIUmphR0V1YzNWalkyVnpjeUJrWlhSaGFXeHpMbU5oY0hSamFHRlFZVzVsYkZ0dmNHVnVYU0FqU2xORkxXbHVjSFYwSUh0Y2JseDBiV2x1TFhkcFpIUm9Pakl3Y0hnN1hHNTlYRzVjYmlOS1UwVXRRMkZ3ZEdOb1lTQmtaWFJoYVd4ekxtTmhjSFJqYUdGUVlXNWxiRnR2Y0dWdVhTQWpTbE5GTFdsdWNIVjBPbUpsWm05eVpTQjdYRzVjZEc5d1lXTnBkSGs2SURFN1hHNTlYRzVjYmlOS1UwVXRRMkZ3ZEdOb1lTQWpTbE5GTFcxelp5QjdYRzVjZEdGc2FXZHVMWE5sYkdZNklHTmxiblJsY2p0Y2JseDBjR0ZrWkdsdVp6b2dNSEI0SURCd2VDQXdjSGdnTkhCNE8xeHVYSFJtYkdWNE9pQXhPMXh1ZlZ4dVhHNGpTbE5GTFVOaGNIUmphR0VnSTBwVFJTMXRjMmNnY0NCN1hHNWNkSFpsY25ScFkyRnNMV0ZzYVdkdU9pQmliM1IwYjIwN1hHNWNkR1JwYzNCc1lYazZJR2x1YkdsdVpTMWliRzlqYXp0Y2JseDBiV0Z5WjJsdU9pQXdjSGc3WEc1Y2RHeHBibVV0YUdWcFoyaDBPaUF4TGpJN1hHNTlYRzVjYmlOS1UwVXRRMkZ3ZEdOb1lTQWpTbE5GTFdKeVlXNWtJSHRjYmx4MFltOXlaR1Z5TFd4bFpuUTZJSE52Ykdsa0lETndlQ0FqUmpsR09VWTVPMXh1WEhSaGJHbG5iaTF6Wld4bU9pQmpaVzUwWlhJN1hHNWNkSGRwWkhSb09pQTJNSEI0TzF4dVhIUndZV1JrYVc1bk9pQXdjSGdnTkhCNE8xeHVYSFIwWlhoMExXRnNhV2R1T2lCalpXNTBaWEk3WEc1OVhHNWNiaU5LVTBVdFEyRndkR05vWVNBalNsTkZMV0p5WVc1a0lITjJaeUI3WEc1Y2RHWnBiR3c2SUNNMU1VSkdSVU03WEc1Y2RIZHBaSFJvT2lBME9IQjRPMXh1ZlZ4dVhHNGpTbE5GTFVOaGNIUmphR0VnSTBwVFJTMURZWEIwWTJoaFJHbHpjR3hoZVNBalNsTkZMV05oY0hSamFHRXRaMkZ0WlMxamIyNTBZV2x1WlhJZ2UxeHVYSFJpWVdOclozSnZkVzVrT2lBalJqSkdPRVpHTzF4dVhIUmliM0prWlhJdGNtRmthWFZ6T2lBMmNIZzdYRzVjZEdobGFXZG9kRG9nTVRBd0pUdGNibHgwY0c5emFYUnBiMjQ2Y21Wc1lYUnBkbVU3WEc1Y2RHOTJaWEptYkc5M09taHBaR1JsYmp0Y2JuMWNiaU5LVTBVdFEyRndkR05vWVNBalNsTkZMVU5oY0hSamFHRkVhWE53YkdGNUlDTktVMFV0WTJGd2RHTm9ZUzFuWVcxbElIdGNibHgwYUdWcFoyaDBPakV3TUNVN1hHNTlYRzVjYmx4dVFHdGxlV1p5WVcxbGN5QnpiR2xrWlVSdmQyNGdlMXh1WEhSbWNtOXRJSHRjYmx4MFhIUnZjR0ZqYVhSNU9pQXdPMXh1WEhSY2RHaGxhV2RvZERvZ01EdGNibHgwWEhSd1lXUmthVzVuT2lBNGNIZzdYRzVjZEZ4MFltOXlaR1Z5TFhSdmNEb2djMjlzYVdRZ05IQjRJQ05HT1VZNVJqazdYRzVjZEgxY2JseHVYSFIwYnlCN1hHNWNkRngwYjNCaFkybDBlVG9nTVR0Y2JseDBYSFJvWldsbmFIUTZJREU1TUhCNE8xeHVYSFJjZEhCaFpHUnBibWM2SURod2VEdGNibHgwWEhSaWIzSmtaWEl0ZEc5d09pQnpiMnhwWkNBMGNIZ2dJMFk1UmpsR09UdGNibHgwWEhRdkttaGxhV2RvZERvZ2RtRnlLQzB0WTI5dWRHVnVkRWhsYVdkb2RDazdLaTljYmx4MGZWeHVmVnh1WEc0alNsTkZMVU5oY0hSamFHRWdaR1YwWVdsc2N5QWpTbE5GTFcxelp6NXdPbUZtZEdWeUlIdGNibHgwWTI5dWRHVnVkRG9nSjBsdElHaDFiV0Z1Snp0Y2JuMWNibHh1STBwVFJTMURZWEIwWTJoaElHUmxkR0ZwYkhNdVkyRndkR05vWVZCaGJtVnNXMjl3Wlc1ZElDTktVMFV0YlhOblBuQTZZV1owWlhJc1hHNGpTbE5GTFVOaGNIUmphR0V1YzNWalkyVnpjeUJrWlhSaGFXeHpMbU5oY0hSamFHRlFZVzVsYkZ0dmNHVnVYU0FqU2xORkxXMXpaejV3T21GbWRHVnlJSHRjYmx4MFkyOXVkR1Z1ZERvZ0owbHRJRzV2ZENCaElISnZZbTkwSnp0Y2JuMWNibHh1STBwVFJTMURZWEIwWTJoaExuTjFZMk5sYzNNZ1pHVjBZV2xzY3lBalNsTkZMVzF6Wno1d09tRm1kR1Z5SUh0Y2JseDBZMjl1ZEdWdWREb2dKMVpsY21sbWFXVmtJR2gxYldGdUp6dGNibjFjYmx4dUkwcFRSUzFwYm5CMWRDQnBibkIxZEZ0MGVYQmxQVndpWTJobFkydGliM2hjSWwwZ2UxeHVYSFF2S25CdmMybDBhVzl1T2lCaFluTnZiSFYwWlR0Y2JseDBkRzl3T2lBdE5UQndlRHNxTDF4dWZWeHVJMHBUUlMxRFlYQjBZMmhoTG1GamRHbDJaU0I3WEc1Y2RHUnBjM0JzWVhrNllteHZZMnM3WEc1OVhHNHZLaW9xS2k5Y2JpSmRmUT09ICovPC9zdHlsZT4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBc2RBLFlBQVksS0FBSyxlQUFDLENBQUMsQUFDbEIsVUFBVSxDQUFFLElBQUksQ0FDaEIsT0FBTyxDQUFFLEdBQUcsQUFDYixDQUFDLEFBRUQsWUFBWSxvQkFBSyxDQUFDLE9BQU8sZUFBQyxDQUFDLEFBQzFCLFVBQVUsQ0FBRSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQUFDaEQsQ0FBQyxBQVFELFlBQVksRUFBRSxlQUFDLENBQUMsQUFDZixhQUFhLENBQUUsR0FBRyxDQUNsQixPQUFPLENBQUUsR0FBRyxDQUNaLE1BQU0sQ0FBRSxHQUFHLENBQ1gsU0FBUyxDQUFFLElBQUksQUFDaEIsQ0FBQyxBQUVELFlBQVksaUJBQUUsQ0FBQyxVQUFVLGVBQUMsQ0FBQyxBQUMxQixNQUFNLENBQUUsSUFBSSxDQUNaLFNBQVMsQ0FBRSxJQUFJLENBQ2YsU0FBUyxDQUFFLElBQUksQ0FDZixNQUFNLENBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFP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 */";
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
    			div.className = "svelte-1eq8y27";
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
    			input.className = "svelte-1eq8y27";
    			add_location(input, file$1, 19, 4, 503);
    			div0.id = "JSE-input";
    			div0.className = "svelte-1eq8y27";
    			add_location(div0, file$1, 18, 3, 478);
    			p.className = "svelte-1eq8y27";
    			add_location(p, file$1, 25, 4, 668);
    			div1.id = "JSE-msg";
    			div1.className = "svelte-1eq8y27";
    			add_location(div1, file$1, 24, 3, 645);
    			attr(path0, "d", "M56.3,556L55.8,704.3C55.9,735.5,72.7,764.5,99.6,780.2L229.3,854.5C256,869.7,289,869.8,316.1,854.7L446.7,779.3C473.6,763.8,490.5,734.9,490.4,703.8L490.9,555.5C490.8,524.3,474,495.3,447.1,479.6L317.4,405.3C290.7,390.1,257.7,390,230.6,405.1L100,480.4C73.1,495.9,56.2,524.8,56.3,556ZM273.3,470L411.9,550.8L411.8,709.9L273.9,789.5L136,710L135.3,549.6L273.3,470Z");
    			attr(path0, "transform", "translate(-55.8,-0.0372215)");
    			set_style(path0, "animation", "a1_t 3.6s linear infinite both");
    			attr(path0, "class", "svelte-1eq8y27");
    			add_location(path0, file$1, 35, 6, 1084);
    			attr(path1, "d", "M510.2,556.3L509.7,704.6C509.8,735.8,526.6,764.8,553.5,780.5L683.2,854.8C709.9,870,742.9,870.1,770,855L900.6,779.6C927.5,764.1,944.4,735.2,944.3,704.1L944.8,555.8C944.7,524.6,927.9,495.6,901,479.9L771.3,405.6C744.6,390.4,711.6,390.3,684.5,405.4L553.9,480.8C527.1,496.3,510.2,525.1,510.2,556.3ZM727.2,470.4L865.8,551.2L865.7,710.3L727.8,789.9L590,710.4L589.3,550L727.2,470.4Z");
    			attr(path1, "transform", "translate(-55.8,-0.0372215)");
    			set_style(path1, "animation", "a2_t 3.6s linear infinite both");
    			attr(path1, "class", "svelte-1eq8y27");
    			add_location(path1, file$1, 39, 6, 1572);
    			attr(path2, "d", "M283,162.2L282.5,310.5C282.6,341.7,299.4,370.7,326.3,386.4L456,460.7C482.7,475.9,515.7,476,542.8,460.9L673.4,385.5C700.3,370,717.2,341.1,717.1,310L717.6,161.7C717.5,130.5,700.7,101.5,673.8,85.8L544.1,11.5C517.4,-3.7,484.4,-3.8,457.3,11.3L326.7,86.7C299.8,102.2,282.9,131,283,162.2ZM499.9,76.3L638.5,157L638.4,316.1L500.5,395.7L362.7,316.2L362,155.9L499.9,76.3Z");
    			attr(path2, "transform", "translate(-55.8,-0.0372215)");
    			set_style(path2, "animation", "a3_t 3.6s linear infinite both");
    			attr(path2, "class", "svelte-1eq8y27");
    			add_location(path2, file$1, 43, 6, 2078);
    			attr(path3, "d", "M585.3,817.8C529.4,832.6,470.5,832.6,414.6,817.7C407,815.7,398,820.2,396.1,828.2C394.3,836.1,398.5,844.5,406.6,846.7C467.5,862.9,532.3,862.9,593.2,846.8C601,844.7,605.8,836.1,603.7,828.3C601.6,820.4,593.2,815.8,585.3,817.8L585.3,817.8Z");
    			attr(path3, "class", "svelte-1eq8y27");
    			add_location(path3, file$1, 49, 8, 2633);
    			attr(g0, "class", "svelte-1eq8y27");
    			add_location(g0, file$1, 48, 7, 2621);
    			attr(g1, "transform", "translate(-55.8,-0.0372215)");
    			attr(g1, "class", "svelte-1eq8y27");
    			add_location(g1, file$1, 47, 6, 2570);
    			attr(path4, "d", "M181.1,413.6C196.2,357.5,225.7,306.7,266.6,265.6C272.3,259.9,272.3,250.1,266.6,244.4C260.9,238.7,251.1,238.6,245.4,244.4C201,289,168.5,344.8,152.2,405.6C150.2,413.2,154.7,422.2,162.7,424.1C170.5,425.9,178.9,421.7,181.1,413.6L181.1,413.6Z");
    			attr(path4, "class", "svelte-1eq8y27");
    			add_location(path4, file$1, 55, 8, 2983);
    			attr(g2, "class", "svelte-1eq8y27");
    			add_location(g2, file$1, 54, 7, 2971);
    			attr(g3, "transform", "translate(-55.8,-0.0372215)");
    			attr(g3, "class", "svelte-1eq8y27");
    			add_location(g3, file$1, 53, 6, 2920);
    			attr(path5, "d", "M733.4,265.5C774.4,306.6,803.8,357.4,818.9,413.5C821,421.3,829.6,426.1,837.4,424C845.3,421.8,850,413.4,847.9,405.5C831.5,344.7,799.1,288.8,754.6,244.2C748.9,238.5,739.1,238.5,733.4,244.2C727.6,250.1,727.6,259.8,733.4,265.5L733.4,265.5Z");
    			attr(path5, "class", "svelte-1eq8y27");
    			add_location(path5, file$1, 61, 8, 3335);
    			attr(g4, "class", "svelte-1eq8y27");
    			add_location(g4, file$1, 60, 7, 3323);
    			attr(g5, "transform", "translate(-55.8,-0.0372215)");
    			attr(g5, "class", "svelte-1eq8y27");
    			add_location(g5, file$1, 59, 6, 3272);
    			attr(g6, "filter", "none");
    			attr(g6, "transform", "translate(498,507) translate(-445.503,-500.996)");
    			set_style(g6, "animation", "a0_t 3.6s linear infinite both");
    			attr(g6, "class", "svelte-1eq8y27");
    			add_location(g6, file$1, 33, 5, 943);
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr(svg, "id", "Layer_1");
    			attr(svg, "x", "0px");
    			attr(svg, "y", "0px");
    			attr(svg, "viewBox", "0 0 1000 1000");
    			set_style(svg, "white-space", "preserve-spaces");
    			attr(svg, "class", "svelte-1eq8y27");
    			add_location(svg, file$1, 31, 4, 758);
    			div2.id = "JSE-brand";
    			div2.className = "svelte-1eq8y27";
    			add_location(div2, file$1, 30, 3, 733);
    			summary.className = "svelte-1eq8y27";
    			add_location(summary, file$1, 16, 2, 434);
    			div3.id = "JSE-captcha-game-container";
    			div3.className = "svelte-1eq8y27";
    			add_location(div3, file$1, 74, 3, 3768);
    			div4.id = "JSE-CaptchaDisplay";
    			div4.className = "svelte-1eq8y27";
    			add_location(div4, file$1, 73, 2, 3735);
    			details.className = "captchaPanel svelte-1eq8y27";
    			details.open = true;
    			add_location(details, file$1, 14, 1, 361);
    			section.id = "JSE-Captcha";
    			section.className = section_class_value = "" + ctx.theme + " " + ctx.size + " svelte-1eq8y27";
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

    			if ((!current || changed.theme || changed.size) && section_class_value !== (section_class_value = "" + ctx.theme + " " + ctx.size + " svelte-1eq8y27")) {
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
    	
    	//import Loadable from './Loadable.svelte' //cant code split iife

    	//Props
    	let { size = 'L', theme = 'flat', captchaServer = 'https://load.jsecoin.com' } = $$props;
    	
    	/*
    	let retry

    	const getDelayedLoader = (delay = 3000) => () =>
    		new Promise((resolve, reject) =>
    		setTimeout(() => resolve(import('./AsyncComponent.svelte')), delay),
    		)

    	const getFailureLoader = (delay = 3000) => () =>
    		new Promise((resolve, reject) =>
    		setTimeout(() => reject(new Error('Some error')), delay),
    		)
    	*/

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
    	//$: console.log('check', captchaCheck);

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
    		if (!document.getElementById("svelte-1eq8y27-style")) add_css$1();
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
