# JSE Captcha

**[JSECOIN](https://jsecoin.com/)** [THE FUTURE BLOCKCHAIN & ECOSYSTEM FOR ECOMMERCE AND DIGITAL ADVERTISING]

## Overview
JSE Captcha is a free to use bot prevention tool. It can be used to protect content and endpoints from automated requests.

Official Release and Developer docs acan be found here: https://developer.jsecoin.com

Setting up the captcha requires two parts, a code snippet on the web page and then a server-side verification check.

#Server-side Verification
It is essential to check the captcha has been completed using server-side code to protect your endpoints. We do this using the clients IP address (IPV4) and the following URL: 

```
https://api.jsecoin.com/captcha/check/:ipAddress/
```

## Demo
Check out our live [Platform](https://jsecoin.com/iCaptcha/).

### Technology:

JSE Captcha has been built with [Svelte](https://svelte.dev).

Svelte is a radical new approach to building user interfaces. Whereas traditional frameworks like React and Vue do the bulk of their work in the browser, Svelte shifts that work into a compile step that happens when you build your app.

Instead of using techniques like virtual DOM diffing, Svelte writes code that surgically updates the DOM when the state of your app changes.

### ReUse in Svelte Apps
```html
<script>
  import JSEcaptcha from 'JSEcaptcha.svelte';
</script>

<JSEcaptcha theme="flat" size="M" on:success={() => console.log('On success!')} on:fail={() => console.log('On fail!')} />
```

### All other Apps / Sites can use IIFE:

IIFE build:

```html
<script src='/jsecaptcha.iife.min.js'></script>

<div id="captcha"></div>
```

Add component:

```javascript
let jseCaptcha = new Jsecaptcha({
    target: document.getElementById('captcha'), //injection point
    props: {
        size: 'S', // ['','S','M','L']
        theme: 'flat', //['','flat']
        //captchaServer: 'https://load.jsecoin.com', //just for JSE devs
    }
});

//success response
jseCaptcha.$on('success', ({ detail }) => {
    console.log('Success: ', detail);
});

//failed reponse
jseCaptcha.$on('fail', ({ detail }) => {
    console.log('Fail: ', detail);
});
```

## Properties

- **size** controls the UI display
  - S - Small
  - M - Medium
  - L - Large
- **theme** available themes
  - flat - only one theme is currently available
- **captchaServer** only used by devs for testing tweaking server side algorithms.
  - url of server (https://load.jsecoin.com)

## Events

- **success** - Emitted on new selected location. `details` property contains a Leaflet lat/lng object.
- **fail** - Emitted on save button click.

## Event Response (JSON)

#### Success
```json
{"success":1,"rating":87,"pass":true,"knownIP":true, "ip":"148.252.129.187"}
```

#### Fail
```json
{"success":1,"rating":0,"pass":false,"knownIP":false, "ip":"148.252.129.187"}
```

## Bug Bounty
This is an initial push alot of cleanup is still required if you spot an issue please report it and if we consider it a major issue we will credit your account as part of our bug bounty offering.
[Bug Bounty Info Page](https://jsecoin.com/en/oddJobs/bugBounty)

## Contribute
If you'd like to assist and help the team please first review our [Contribution Guidelines](./CONTRIBUTING.md).

## License
This project is under the [GNU General Public License v3.0](./LICENSE.md).