<!-- DOM Tag Name-->
<svelte:options tag="jse-asteroids"/>
<!-- xDOM Tag Name-->
<div id="JSE-game" class="game" on:click="{captchaClick}" on:mousemove="{moveSpaceship}" on:touchmove="{moveSpaceship}">
	{#each gameElement as ele, i}
		<div on:click|once="{() => smash(i)}" class:active="{ele.smashed}" class:asteroid="{(ele.type === 'asteroid')}" class:spaceship="{(ele.type === 'spaceShip')}" draggable="{draggable}" class="gfx" style="transform: rotate({ele.r}deg); top: {ele.y}px; left: {ele.x}px;"></div>
	{/each}
</div>

<script>
	import { onMount, createEventDispatcher } from 'svelte';

	//Events
	const dispatch = createEventDispatcher();

	//Data model
	const mlData = { mouseClicks:0 };

	//GFX
	const spaceShipIco = 'data:image/png;base64,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';
	const asteroidSource = '';
	const asteroidFlame = 'data:image/png;base64,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';
	
	//force draggable false
	const draggable = false;

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
		gameElement[i].smashed = true;
		gameElement[i].src = asteroidFlame;
		
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

		gameElement[0].r = Math.atan2(mouseY - gameElement[0].y, mouseX - gameElement[0].x) * (180 / Math.PI) + 85;
	};

	const draw = () => {
		gameElement[1].x -= 6;
		if (gameElement[1].x <= 0) gameElement[1].x = 290;
		gameElement[1].r += 5;

		gameElement[2].y -= 3;
		if (gameElement[2].y <= 0) gameElement[2].y = 190;
		gameElement[2].r -= 3;

		gameElement[3].x -= 3;
		gameElement[3].y -= 3;
		if (gameElement[3].x <= 0 && gameElement[3].y <= 0) {
			gameElement[3].x = 230;
			gameElement[3].y = 190;
		}
		gameElement[3].r += 4;
	}

	update = setInterval(draw, 100);

	//Game complete
	const gameCompleted = () => {
		mlData.finishTime = new Date().getTime();
		dispatch('complete', mlData);
	};

	//collect clicks
	const captchaClick = () =>{
		mlData.mouseClicks += 1;
	};
</script>

<style>

</style>
