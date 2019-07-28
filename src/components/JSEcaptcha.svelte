<!-- DOM Tag Name-->
<svelte:options tag="jse-captcha"/>
<!-- xDOM Tag Name-->

<!-- JSE Captcha -->
<!-- 
	Optional classes
	flat: swaps to flat design
	S: Small captcha
	M: Mecium captcha
	success: displays success panel captcha must be minimised
-->

<section id="JSE-Captcha" class="{theme} {size}" class:active="{showCaptcha}" class:success="{complete}">
	<details class="captchaPanel" bind:open open>
		<!-- Captcha Panel -->
		<summary>
			<!-- Input select field -->
			<div id="JSE-input">
				<input id="captchaCheck" type="checkbox" bind:checked={captchaCheck} />
			</div>
			<!-- xInput select field -->
			
			<!-- Info msg -->
			<div id="JSE-msg">
				<p></p>
			</div>
			<!-- xInfo msg -->

			<!-- JSE logo -->
			<div id="JSE-brand">
				<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" id="Layer_1"
					x="0px" y="0px" viewBox="0 0 1000 1000" style="white-space: preserve-spaces;">
					<g filter="none" transform="translate(498,507) translate(-445.503,-500.996)"
						style="animation: a0_t 3.6s linear infinite both;">
						<path
							d="M56.3,556L55.8,704.3C55.9,735.5,72.7,764.5,99.6,780.2L229.3,854.5C256,869.7,289,869.8,316.1,854.7L446.7,779.3C473.6,763.8,490.5,734.9,490.4,703.8L490.9,555.5C490.8,524.3,474,495.3,447.1,479.6L317.4,405.3C290.7,390.1,257.7,390,230.6,405.1L100,480.4C73.1,495.9,56.2,524.8,56.3,556ZM273.3,470L411.9,550.8L411.8,709.9L273.9,789.5L136,710L135.3,549.6L273.3,470Z"
							transform="translate(-55.8,-0.0372215)"
							style="animation: a1_t 3.6s linear infinite both;" />
						<path
							d="M510.2,556.3L509.7,704.6C509.8,735.8,526.6,764.8,553.5,780.5L683.2,854.8C709.9,870,742.9,870.1,770,855L900.6,779.6C927.5,764.1,944.4,735.2,944.3,704.1L944.8,555.8C944.7,524.6,927.9,495.6,901,479.9L771.3,405.6C744.6,390.4,711.6,390.3,684.5,405.4L553.9,480.8C527.1,496.3,510.2,525.1,510.2,556.3ZM727.2,470.4L865.8,551.2L865.7,710.3L727.8,789.9L590,710.4L589.3,550L727.2,470.4Z"
							transform="translate(-55.8,-0.0372215)"
							style="animation: a2_t 3.6s linear infinite both;" />
						<path
							d="M283,162.2L282.5,310.5C282.6,341.7,299.4,370.7,326.3,386.4L456,460.7C482.7,475.9,515.7,476,542.8,460.9L673.4,385.5C700.3,370,717.2,341.1,717.1,310L717.6,161.7C717.5,130.5,700.7,101.5,673.8,85.8L544.1,11.5C517.4,-3.7,484.4,-3.8,457.3,11.3L326.7,86.7C299.8,102.2,282.9,131,283,162.2ZM499.9,76.3L638.5,157L638.4,316.1L500.5,395.7L362.7,316.2L362,155.9L499.9,76.3Z"
							transform="translate(-55.8,-0.0372215)"
							style="animation: a3_t 3.6s linear infinite both;" />
						<g transform="translate(-55.8,-0.0372215)">
							<g>
								<path
									d="M585.3,817.8C529.4,832.6,470.5,832.6,414.6,817.7C407,815.7,398,820.2,396.1,828.2C394.3,836.1,398.5,844.5,406.6,846.7C467.5,862.9,532.3,862.9,593.2,846.8C601,844.7,605.8,836.1,603.7,828.3C601.6,820.4,593.2,815.8,585.3,817.8L585.3,817.8Z" />
							</g>
						</g>
						<g transform="translate(-55.8,-0.0372215)">
							<g>
								<path
									d="M181.1,413.6C196.2,357.5,225.7,306.7,266.6,265.6C272.3,259.9,272.3,250.1,266.6,244.4C260.9,238.7,251.1,238.6,245.4,244.4C201,289,168.5,344.8,152.2,405.6C150.2,413.2,154.7,422.2,162.7,424.1C170.5,425.9,178.9,421.7,181.1,413.6L181.1,413.6Z" />
							</g>
						</g>
						<g transform="translate(-55.8,-0.0372215)">
							<g>
								<path
									d="M733.4,265.5C774.4,306.6,803.8,357.4,818.9,413.5C821,421.3,829.6,426.1,837.4,424C845.3,421.8,850,413.4,847.9,405.5C831.5,344.7,799.1,288.8,754.6,244.2C748.9,238.5,739.1,238.5,733.4,244.2C727.6,250.1,727.6,259.8,733.4,265.5L733.4,265.5Z" />
							</g>
						</g>
					</g>
				</svg>
			</div>
			<!-- xJSE logo -->
		</summary>
		<!-- xCaptcha Panel -->

		<!-- Captcha Game -->
		<div id="JSE-CaptchaDisplay">
			<div id="JSE-captcha-game-container" on:mousemove="{handleMovement}" on:touchmove="{handleMovement}">
			{#if open}	
				<div id="JSE-captcha-game">
					<Asteroids on:complete="{callbackFunction}" />
				</div>
			{/if}
			</div>
		</div>
		<!-- xCaptcha Game -->
	</details>
</section>
<!-- xJSE Captcha -->




<script>
	//libs
	import { onMount, createEventDispatcher } from 'svelte';
	import Asteroids from './Asteroids.svelte'

	//Props
	export let size = 'L';
	export let theme = 'flat';
	export let captchaServer = 'https://load.jsecoin.com';

	//Events
	const dispatch = createEventDispatcher();
	
	//Init captcha
	let open = false;
	let showCaptcha = false;
	let captchaCheck = false;
	let complete = false;

	setTimeout(() => {
		showCaptcha = true;
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

	/**
	 * loadGame
	 * disabled until figure best way to do code splitting...
     * @param {string} gameFile url of gamefile to load
     * @param {callback} cb Callback function
	 */
	const loadGame = (gameFile,cb) => {
		/*
		 //request conf
        requestURL({
            method: 'get',
            url: `${captchaServer}/captcha/load/${gameFile}`
        //success
        }).then((res) => {
			console.log('[res][loadConf]',res);
			cb(res.content);
            
        //error
        }).catch((err) => {
            console.error(err);
		});
		*/
	}

	/**
	 * gameCompleted
	 * disabled until figure best way to do code splitting...
	 */
	const gameCompleted = () => {
		/*
		mlData.finishTime = new Date().getTime();
		mlData.gamesCompleted += 1;
		submitMLData(
		(res) => {
			var JSECaptchaPass = document.createEvent('Event');
			JSECaptchaPass.initEvent('JSECaptchaPass', true, true);
			JSECaptchaPass.ip = res.ip;
			JSECaptchaPass.rating = res.rating;
			JSECaptchaPass.pass = res.pass;
			document.dispatchEvent(JSECaptchaPass);
			self.JSECaptchaCompleted = true;
		}, (res) => {
			loadRandomGame();
		});*/
	};

	/**
	 * loadRandomGame
	 * loads random game fixed to asteroids for now..
	 */
	const loadRandomGame = () => {
		//const games = ['asteroids.js', 'tictactoe.js', 'pilot.js']; 
		const games = ['asteroids.js']; 
		const choosenGame = games[Math.floor(Math.random()*games.length)];
		loadGame(choosenGame, (gameCode) => {
			console.log(gameCode);
			const game = new Function(gameCode);
			game();
		});
	}

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

	mlData.url = window.location.href;
	mlData.userAgent = navigator.userAgent || 0;
	mlData.platform = navigator.platform || 0;
	mlData.referrer = document.referrer || 0;
	mlData.runOnce = window.JSERunOnce || false;
	mlData.language = window.navigator.language || 0;

	if (navigator.languages) { 
		mlData.languages = navigator.languages.join('') || 0;
	} else {
		mlData.languages = 1;
	}

	mlData.timezoneOffset = new Date().getTimezoneOffset() || 0;
	mlData.appName = window.navigator.appName || 0;
	mlData.screenWidth = window.screen.width || 0;
	mlData.screenHeight = window.screen.height || 0;
	mlData.screenDepth = window.screen.colorDepth || 0;
	mlData.screen = mlData.screenWidth+'x'+mlData.screenHeight+'x'+mlData.screenDepth; // 1920x1080x24
	mlData.innerWidth = window.innerWidth || 0;
	mlData.innerHeight = window.innerHeight || 0;
	mlData.deviceMemory = navigator.deviceMemory || navigator.hardwareConcurrency || 0;
	mlData.protoString = Object.keys(navigator.__proto__).join('').substring(0, 100) || 0;

	if (window.frameElement === null) {
		mlData.iFrame = false;
	} else {
		mlData.iFrame = true;
	}
	


	//on details open
	$: if (open) {
		mlData.tickTime = new Date().getTime();
		loadRandomGame();
	} else {

	}

	//input selected
	$: mlData.checkBox = (captchaCheck)?1:0;

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

		mlData.mouseEvents += 1;
		if (mouseY < mlData.mouseY) mlData.mouseDown += 1;
		if (mouseY > mlData.mouseY) mlData.mouseUp += 1;
		if (mouseX > mlData.mouseX) mlData.mouseRight += 1;
		if (mouseX < mlData.mouseX) mlData.mouseLeft += 1;

		mlData.mouseX = mouseX;
		mlData.mouseY = mouseY;
		mlData.mousePattern.push(parseInt(mouseX) + 'x' + parseInt(mouseY));
	}
	
	const callbackFunction = (e) => {
		console.log('complete')
		mlData.gamesCompleted += 1;
		mlData.mouseClicks = e.detail.mouseClicks;
		mlData.finishTime = e.detail.finishTime; 
		
		//close captcha
		open = false;

		//submit data
		submitMLData(
			(res) => {
				const JSECaptchaPass = {};
				JSECaptchaPass.ip = res.ip;
				JSECaptchaPass.rating = res.rating;
				JSECaptchaPass.pass = res.pass;
				
				dispatch('success', JSECaptchaPass);
				complete = true;
			}, 
			(res) => {
				open = true;
				dispatch('fail', 1);
				loadRandomGame();
			}
		);
	}


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
</script>





<style>
/**
* FLAT
**/
#JSE-Captcha.flat {
	background: none;
	padding: 0px;
}

#JSE-Captcha.flat details {
	box-shadow: 0px 0px 0px 4px rgba(0, 0, 0, 0.06);
}

/****/


/**
* SMALL
**/
#JSE-Captcha.S {
	border-radius: 6px;
	padding: 8px;
	margin: 5px;
	font-size: 11px;
}

#JSE-Captcha.S #JSE-input {
	height: 20px;
	min-width: 20px;
	font-size: 15px;
	border: solid 1px #D3D8DD;
	padding: 2px;
	margin: 6px;
}

#JSE-Captcha.S #JSE-brand {
	width: 30px;
	border-left: solid 2px #F9F9F9;
}

#JSE-Captcha.S #JSE-brand svg {
	width: 24px;
}

#JSE-Captcha.S.flat details {
	box-shadow: 0px 0px 0px 2px rgba(0, 0, 0, 0.06);
}

/****/

/**
* MEDIUM
**/
#JSE-Captcha.M {
	border-radius: 6px;
	padding: 8px;
	margin: 5px;
	font-size: 16px;
}

#JSE-Captcha.M #JSE-input {
	height: 30px;
	min-width: 30px;
	font-size: 22px;
	border: solid 2px #D3D8DD;
	margin: 8px;
}

#JSE-Captcha.M #JSE-brand {
	width: 38px;
	border-left: solid 2px #F9F9F9;

}

#JSE-Captcha.M #JSE-brand svg {
	width: 34px;
	margin-top: 4px;
}

#JSE-Captcha.M.flat details {
	box-shadow: 0px 0px 0px 2px rgba(0, 0, 0, 0.06);
}

/****/

/**
* LARGE
**/
#JSE-Captcha.L {}
:global(#JSE-Captcha.L input#captchaCheck) {
	width:30px;
	height:30px;
	margin:10px;
}
/****/


/**
* BASE
**/
#JSE-Captcha {
	display:none;
	background: #F2F8FF;
	border-radius: 6px;
	clear: both;
	padding: 13px;
	margin: 10px;
	min-width: 200px;
	max-width: 314px;
	color: #707070;
	font-size: 20px;
	font-family: 'Montserrat', sans-serif;
}

#JSE-Captcha * {
	user-select: none;
}

#JSE-Captcha details {
	overflow: hidden;
	margin: 0px;
	background: #fff;
	border-radius: 4px;
	box-shadow: 0px 3px 6px 0px rgba(0, 0, 0, 0.12);
}

#JSE-Captcha details summary {
	display: flex;
	outline: none;
}

#JSE-Captcha details #JSE-CaptchaDisplay {
	opacity: 0;
	margin: 0px;
	padding: 0px;
	height: 0px;
	transition: opacity 0.2s, height 0.4s;
	background: #fff;
}

#JSE-Captcha details.captchaPanel[open] #JSE-CaptchaDisplay {
	animation-name: slideDown;
	animation-duration: 0.3s;
	animation-fill-mode: forwards;
	animation-delay: 0.3s;
}

#JSE-Captcha #JSE-input {
	border: solid 4px #D3D8DD;
	border-radius: 4px;
	margin: 10px;
	min-width: 40px;
	height: 40px;
	cursor: pointer;
	font-size: 28px;
	text-align: center;
	position: relative;
	overflow: hidden;
}

#JSE-Captcha details>summary::-webkit-details-marker {
	display: none;
}

#JSE-Captcha details #JSE-input:hover:before {
	content: '🤖';
	opacity: 1;
}

#JSE-Captcha.success details #JSE-input:before {
	content: '😉';
	opacity: 1;
}

#JSE-Captcha.success details #JSE-input:after {
	content: '✔';
	opacity: 1;
	color: #26AE60;
	padding: 0px 4px 0px 5px;
	border-left: solid 2px #D3D8DD;
}


#JSE-Captcha.success details.captchaPanel[open] #JSE-input:after {
	content: '';
	opacity: 0;
	padding: 0px;
	border: 0px;
	
}

#JSE-Captcha details #JSE-input:before,
#JSE-Captcha details.captchaPanel[open] #JSE-input:before {
	opacity: 0;
	/*font-size: 28px;*/
	content: '🤖';
	transition: opacity 0.2s;
	position: absolute;
	top:0px;
	left:0px;
	bottom:0px;
	right:0px;
	background:#fff;
}
#JSE-Captcha.success details.captchaPanel #JSE-input:before {
	right:50%;
}
#JSE-Captcha.success details.captchaPanel[open] #JSE-input:after {
	display: none;
}
#JSE-Captcha.success details.captchaPanel #JSE-input:after {
	left:50%;
	position: absolute;
	top:0px;
	bottom:0px;
	right:0px;
	background:#fff;
}
#JSE-Captcha.success #JSE-input {
	min-width:52px;
}
#JSE-Captcha.success details.captchaPanel[open] #JSE-input {
	min-width:20px;
}

#JSE-Captcha details.captchaPanel[open] #JSE-input:before {
	opacity: 1;
}

#JSE-Captcha #JSE-msg {
	align-self: center;
	padding: 0px 0px 0px 4px;
	flex: 1;
}

#JSE-Captcha #JSE-msg p {
	vertical-align: bottom;
	display: inline-block;
	margin: 0px;
	line-height: 1.2;
}

#JSE-Captcha #JSE-brand {
	border-left: solid 3px #F9F9F9;
	align-self: center;
	width: 60px;
	padding: 0px 4px;
	text-align: center;
}

#JSE-Captcha #JSE-brand svg {
	fill: #51BFEC;
	width: 48px;
}

#JSE-Captcha #JSE-CaptchaDisplay #JSE-captcha-game-container {
	background: #F2F8FF;
	border-radius: 6px;
	height: 100%;
	position:relative;
	overflow:hidden;
}
#JSE-Captcha #JSE-CaptchaDisplay #JSE-captcha-game {
	height:100%;
}


@keyframes slideDown {
	from {
		opacity: 0;
		height: 0;
		padding: 8px;
		border-top: solid 4px #F9F9F9;
	}

	to {
		opacity: 1;
		height: 190px;
		padding: 8px;
		border-top: solid 4px #F9F9F9;
		/*height: var(--contentHeight);*/
	}
}

#JSE-Captcha details #JSE-msg>p:after {
	content: 'Im human';
}

#JSE-Captcha details.captchaPanel[open] #JSE-msg>p:after,
#JSE-Captcha.success details.captchaPanel[open] #JSE-msg>p:after {
	content: 'Im not a robot';
}

#JSE-Captcha.success details #JSE-msg>p:after {
	content: 'Verified human';
}

#JSE-input input[type="checkbox"] {
	/*position: absolute;
	top: -50px;*/
}
#JSE-Captcha.active {
	display:block;
}
/****/
.game {
	height:100%;
	background:#000;
	cursor: url('data:image/png;base64,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'), auto;
}

.gfx {
	position:absolute;
	opacity:1;
	transition: opacity 0.6s;
}

.gfx.active {
	opacity:0;
}
</style>