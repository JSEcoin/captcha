<script>
  import JSEcaptcha from './components/components.module.js';
</script>

<JSEcaptcha theme="flat" size="M" on:success={() => console.log('On success!')} on:fail={() => console.log('On fail!')} />