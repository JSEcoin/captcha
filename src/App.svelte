<script>
  import JSEcaptcha from './components/components.module.js';
</script>

<div id="JSE-CaptchaWrapper">
  <JSEcaptcha theme="flat" size="M" debug="{true}" on:success={() => console.log('On success!')} on:fail={() => console.log('On fail!')} />
</div>

<style>
#JSE-CaptchaWrapper {
  margin:10px;
}
</style>