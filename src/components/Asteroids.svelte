<!-- DOM Tag Name-->
<svelte:options tag="jse-asteroids"/>
<!-- xDOM Tag Name-->
<div id="JSE-game" class="game" on:click="{captchaClick}" on:mousemove="{moveSpaceship}" on:touchmove="{moveSpaceship}">
	{#each gameElement as ele, i}
		<div on:click|once="{() => smash(i)}" class:active="{(ele.type === 'asteroid')?ele.smashed:false}" class:asteroid="{(ele.type === 'asteroid')}" class:spaceship="{(ele.type === 'spaceShip')}" draggable="{draggable}" class="gfx" style="transform: rotate({ele.r}deg); top: {ele.y}px; left: {ele.x}px;"></div>
	{/each}
</div>

<script>
	import { createEventDispatcher } from 'svelte';

	//Events
	const dispatch = createEventDispatcher();

	//Data model
	const mlData = { mouseClicks:0 };

	//force draggable false
	const draggable = false;

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
		gameElement[i].smashed = true;
		
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
