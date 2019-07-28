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


.gfx {
	position:absolute;
	opacity:1;
	transition: opacity 0.6s;
}

.gfx.active {
	opacity:0;
}


.game {
	height:100%;
	background-size:350px;
	background-repeat:no-repeat;
	background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='254.732' height='142.65' viewBox='0 0 254.732 142.65'%3E%3Crect width='254.732' height='142.65' fill='%2326136e'/%3E%3Cg transform='translate(13.799 8.326)'%3E%3Cg transform='translate(66.725 16.157)'%3E%3Cpath d='M600.042,261.883A46.842,46.842,0,1,0,553.2,215.042a46.93,46.93,0,0,0,46.842,46.842Z' transform='translate(-553.2 -168.2)' fill='%23331178' fill-rule='evenodd'/%3E%3Cpath d='M637.039,292.578A40.539,40.539,0,1,0,596.5,252.039a40.616,40.616,0,0,0,40.539,40.539Z' transform='translate(-590.197 -205.197)' fill='%233a1580' fill-rule='evenodd'/%3E%3Cpath d='M694.542,340.285A30.743,30.743,0,1,0,663.8,309.543a30.807,30.807,0,0,0,30.742,30.743Z' transform='translate(-647.701 -262.701)' fill='%2344158f' fill-rule='evenodd'/%3E%3Cpath d='M751.534,387.567A21.034,21.034,0,1,0,730.5,366.534a21.072,21.072,0,0,0,21.034,21.034Z' transform='translate(-704.692 -319.692)' fill='%23521b96' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(0)'%3E%3Cpath d='M112.413,92.411A17.606,17.606,0,1,0,94.8,74.8a17.643,17.643,0,0,0,17.613,17.613Z' transform='translate(-94.8 -57.2)' fill='%23341270' fill-rule='evenodd'/%3E%3Cpath d='M126.34,103.966a15.233,15.233,0,1,0-15.24-15.24,15.26,15.26,0,0,0,15.24,15.24Z' transform='translate(-108.727 -71.127)' fill='%233d1273' fill-rule='evenodd'/%3E%3Cpath d='M147.958,121.9A11.55,11.55,0,1,0,136.4,110.343,11.573,11.573,0,0,0,147.958,121.9Z' transform='translate(-130.345 -92.745)' fill='%23491279' fill-rule='evenodd'/%3E%3Cpath d='M169.4,139.608a7.9,7.9,0,1,0-7.9-7.9,7.921,7.921,0,0,0,7.9,7.9Z' transform='translate(-151.791 -114.106)' fill='%2355147f' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(191.777 14.905)'%3E%3Cpath d='M1418.952,172.9a6.652,6.652,0,1,0-6.652-6.652,6.66,6.66,0,0,0,6.652,6.652Z' transform='translate(-1412.3 -159.6)' fill='%23341270' fill-rule='evenodd'/%3E%3Cpath d='M1424.249,177.314a5.757,5.757,0,1,0-5.75-5.75,5.774,5.774,0,0,0,5.75,5.75Z' transform='translate(-1417.597 -164.898)' fill='%233d1273' fill-rule='evenodd'/%3E%3Cpath d='M1432.367,184.034a4.367,4.367,0,1,0-4.367-4.367,4.38,4.38,0,0,0,4.367,4.367Z' transform='translate(-1425.715 -173.015)' fill='%23491279' fill-rule='evenodd'/%3E%3Cpath d='M1440.484,190.768a2.984,2.984,0,1,0-2.984-2.984,2.988,2.988,0,0,0,2.984,2.984Z' transform='translate(-1433.832 -181.132)' fill='%2355147f' fill-rule='evenodd'/%3E%3C/g%3E%3C/g%3E%3Cg transform='translate(198.997 65.488)'%3E%3Cpath d='M1377.433,470.38a10.24,10.24,0,1,0-10.233-10.247,10.263,10.263,0,0,0,10.233,10.247Z' transform='translate(-1367.185 -449.9)' fill='%23f66' fill-rule='evenodd'/%3E%3Cpath d='M1391.076,449.9a10.24,10.24,0,1,1,0,20.48c-1.033-.277-3.2-.451-2.853-1.412.175-.48,1.543.189,2.9.306,1.805.131,3.7-.233,3.916-.815.306-.873-1.863-.291-4.367-.422-2.969-.16-6.376-1.033-6.288-2.416.073-1.048,3.057.306,6,.568,3,.277,5.953-.553,6.114-2.3.16-1.776-2.737-1.325-6.084-1.4-3.13-.073-7.1-1.135-7.234-3.028-.146-2.038,3.057-1.194,6.084-1.252,3.057-.058,5.953-1.034,5.415-3.071-.291-1.106-2.111-.408-4.367-.306s-4.993-.378-5.167-1.31c-.32-1.747,3.784-3.406,5.939-3.625Z' transform='translate(-1380.829 -449.9)' fill='%23c43f57' fill-rule='evenodd'/%3E%3Cpath d='M1377.348,449.9c.335,0,.67.015.99.044h-.233a10.25,10.25,0,0,0-.99,20.451,10.249,10.249,0,0,1,.233-20.5Z' transform='translate(-1367.1 -449.9)' fill='%23df99ff' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(72.271 34.338)'%3E%3Cpath d='M498.727,240.354a2.227,2.227,0,1,0-2.227-2.227,2.236,2.236,0,0,0,2.227,2.227Z' transform='translate(-496.5 -235.9)' fill='%237c1370' fill-rule='evenodd'/%3E%3Cpath d='M505.589,238.315a2.228,2.228,0,0,1-1.223,4.09,1.582,1.582,0,0,1-.262-.015,2.228,2.228,0,0,1,1.223-4.09c.087,0,.175.015.262.015Z' transform='translate(-502.139 -237.951)' fill='%23be2385' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(112.024 55.983)'%3E%3Cpath d='M784.942,415.284A15.342,15.342,0,1,0,769.6,399.942a15.372,15.372,0,0,0,15.342,15.342Z' transform='translate(-769.6 -384.6)' fill='%236838a4' fill-rule='evenodd'/%3E%3Cpath d='M804.167,431.234A12.067,12.067,0,1,0,792.1,419.167a12.092,12.092,0,0,0,12.067,12.067Z' transform='translate(-788.825 -403.825)' fill='%23794dae' fill-rule='evenodd'/%3E%3Cpath d='M819.718,444.136a9.418,9.418,0,1,0-9.418-9.418,9.433,9.433,0,0,0,9.418,9.418Z' transform='translate(-804.376 -419.376)' fill='%239e7ec5' fill-rule='evenodd'/%3E%3Cpath d='M827.151,450.3A8.151,8.151,0,1,0,819,442.151a8.166,8.166,0,0,0,8.151,8.151Z' transform='translate(-811.809 -426.809)' fill='%23fff' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(44.134 114.12)'%3E%3Cpath d='M303.984,888.147a.755.755,0,0,1,.393.1c.116.073,13.974-7.773,14.047-7.656s-13.625,8.21-13.625,8.37a.8.8,0,1,1-1.6,0,.79.79,0,0,1,.786-.815Z' transform='translate(-303.197 -866.531)' fill='%23ffc' fill-rule='evenodd'/%3E%3Cpath d='M304.926,934.952a.626.626,0,1,0,0-1.252.621.621,0,0,0-.626.626.631.631,0,0,0,.626.626Z' transform='translate(-304.139 -911.909)' fill='%23ff6' fill-rule='evenodd'/%3E%3Cpath d='M305.822,936.344a.422.422,0,1,0-.422-.422.422.422,0,0,0,.422.422Z' transform='translate(-305.079 -913.447)' fill='%23fc0' fill-rule='evenodd'/%3E%3Cpath d='M425.943,796.372c.029-.015,21.368-12.416,21.4-12.373s-21.208,12.591-21.252,12.62c-.291.175-.408-.087-.146-.247Z' transform='translate(-407.951 -783.999)' fill='%23ffc' fill-rule='evenodd'/%3E%3C/g%3E%3Cg transform='translate(7.773 4.09)'%3E%3Cpath d='M641.864,111.213a.36.36,0,0,0,.364-.364.348.348,0,0,0-.364-.349.357.357,0,1,0,0,.713Z' transform='translate(-555.896 -98.506)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M480.564,81.628a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-418.075 -73.214)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M416.364,279.228a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-363.22 -242.051)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M554.064,530.028a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-480.876 -456.345)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M421.264,652.213a.357.357,0,0,0,.364-.349.37.37,0,0,0-.364-.364.357.357,0,1,0,0,.713Z' transform='translate(-367.406 -560.757)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M473.164,662.028a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-411.752 -569.131)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M687.964,847.128a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-595.285 -727.287)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M621.364,891.713a.36.36,0,0,0,.364-.364.348.348,0,0,0-.364-.349.357.357,0,1,0,0,.713Z' transform='translate(-538.38 -765.395)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M179.264,689.128a.364.364,0,1,0-.364-.364.38.38,0,0,0,.364.364Z' transform='translate(-160.632 -592.286)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M799.164,642.228a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-690.299 -552.213)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1028.764,745.928a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-886.478 -640.818)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1243.664,543.428a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1070.097 -467.794)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1401.664,348.328a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-1205.098 -301.093)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1362.164,254.528a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1171.348 -220.947)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1473.944,203.613a.357.357,0,1,0,0-.713.348.348,0,0,0-.349.364.336.336,0,0,0,.349.349Z' transform='translate(-1266.869 -177.456)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1552.364,197.728a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1333.862 -172.415)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1453.364,157.728a.364.364,0,1,0-.364-.364.352.352,0,0,0,.364.364Z' transform='translate(-1249.273 -138.237)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1305.364,39.728a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-1122.816 -37.413)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1673.364,39.728a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-1437.249 -37.413)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1663.464,229.828a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1428.79 -199.842)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1539.964,471.828a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1323.267 -406.616)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1651.064,578.028a.364.364,0,1,0-.364-.364.37.37,0,0,0,.364.364Z' transform='translate(-1418.195 -497.358)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1591.864,753.413a.36.36,0,0,0,.364-.364.348.348,0,0,0-.364-.349.357.357,0,1,0,0,.713Z' transform='translate(-1367.612 -647.226)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1273.264,738.528a.364.364,0,1,0-.364-.364.36.36,0,0,0,.364.364Z' transform='translate(-1095.388 -634.495)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1142.364,859.528a.364.364,0,1,0-.364-.364.38.38,0,0,0,.364.364Z' transform='translate(-983.542 -737.882)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1026.364,123.628a.348.348,0,0,0,.349-.364.357.357,0,1,0-.349.364Z' transform='translate(-884.427 -109.101)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M132.364,52.028a.348.348,0,0,0,.349-.364.357.357,0,1,0-.713,0,.37.37,0,0,0,.364.364Z' transform='translate(-120.559 -47.923)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M145.2,62.494a.59.59,0,0,0,.6-.6.6.6,0,0,0-.6-.6.609.609,0,0,0-.6.6.6.6,0,0,0,.6.6Z' transform='translate(-131.325 -56.467)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M279.6,29.294a.6.6,0,0,0,.6-.6.609.609,0,0,0-.6-.6.6.6,0,0,0-.6.6.59.59,0,0,0,.6.6Z' transform='translate(-246.161 -28.1)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M329,76.194a.609.609,0,0,0,.6-.6.6.6,0,0,0-.6-.6.6.6,0,0,0,0,1.194Z' transform='translate(-288.371 -68.173)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M641.3,52.794a.6.6,0,0,0,.6-.6.59.59,0,0,0-.6-.6.6.6,0,0,0,0,1.194Z' transform='translate(-555.212 -48.179)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M266.4,375.394a.6.6,0,0,0,.6-.6.609.609,0,0,0-.6-.6.6.6,0,0,0-.6.6.59.59,0,0,0,.6.6Z' transform='translate(-234.883 -323.821)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M572.6,718.694a.6.6,0,0,0,.6-.6.609.609,0,0,0-.6-.6.6.6,0,1,0,0,1.194Z' transform='translate(-496.512 -617.15)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M54,876.694a.6.6,0,1,0,0-1.194.609.609,0,0,0-.6.6.6.6,0,0,0,.6.6Z' transform='translate(-53.4 -752.152)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1002.3,908.794a.59.59,0,0,0,.6-.6.6.6,0,0,0-.6-.6.609.609,0,0,0-.6.6.59.59,0,0,0,.6.6Z' transform='translate(-863.664 -779.579)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1192.9,474.194a.6.6,0,0,0,.6-.6.59.59,0,0,0-.6-.6.6.6,0,1,0,0,1.194Z' transform='translate(-1026.52 -408.24)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1588.1,673.494a.59.59,0,0,0,.6-.6.6.6,0,0,0-.6-.6.609.609,0,0,0-.6.6.6.6,0,0,0,.6.6Z' transform='translate(-1364.195 -578.53)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M935.4,220.094a.6.6,0,0,0,.6-.6.59.59,0,0,0-.6-.6.6.6,0,0,0-.6.6.59.59,0,0,0,.6.6Z' transform='translate(-806.502 -191.127)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1582.6,63.494a.609.609,0,0,0,.6-.6.6.6,0,1,0-1.194,0,.609.609,0,0,0,.6.6Z' transform='translate(-1359.495 -57.322)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M679.247,446.995a.247.247,0,1,0-.247-.247.245.245,0,0,0,.247.247Z' transform='translate(-587.937 -385.597)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M677.547,160.995a.255.255,0,0,0,.247-.247.245.245,0,0,0-.247-.247.247.247,0,1,0,0,.495Z' transform='translate(-586.484 -141.228)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M965.247,65.595a.255.255,0,0,0,.247-.247.245.245,0,0,0-.247-.247.237.237,0,0,0-.247.247.245.245,0,0,0,.247.247Z' transform='translate(-832.306 -59.714)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1315.948,297.695a.247.247,0,1,0-.247-.247.237.237,0,0,0,.247.247Z' transform='translate(-1131.958 -258.029)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1565.348,297.695a.255.255,0,0,0,.247-.247.245.245,0,0,0-.247-.247.255.255,0,0,0-.248.247.237.237,0,0,0,.248.247Z' transform='translate(-1345.055 -258.029)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1627.048,517.495a.247.247,0,0,0,0-.495.247.247,0,1,0,0,.495Z' transform='translate(-1397.774 -445.835)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1041.748,537.295a.247.247,0,0,0,0-.495.247.247,0,1,0,0,.495Z' transform='translate(-897.671 -462.753)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1138.147,729.895a.247.247,0,1,0-.247-.247.245.245,0,0,0,.247.247Z' transform='translate(-980.039 -627.318)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M426.947,406.395a.247.247,0,1,0,0-.495.255.255,0,0,0-.247.247.245.245,0,0,0,.247.247Z' transform='translate(-372.362 -350.907)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M256.447,213.195a.247.247,0,1,0-.247-.247.245.245,0,0,0,.247.247Z' transform='translate(-226.68 -185.829)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M251.547,337.295a.247.247,0,1,0-.247-.247.255.255,0,0,0,.247.247Z' transform='translate(-222.493 -291.865)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M157.747,510.095a.247.247,0,0,0,0-.495.245.245,0,0,0-.247.247.237.237,0,0,0,.247.247Z' transform='translate(-142.347 -439.512)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M214.347,175.195a.245.245,0,0,0,.247-.247.247.247,0,0,0-.495,0,.245.245,0,0,0,.247.247Z' transform='translate(-190.708 -153.361)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M370.14,322.495a.255.255,0,0,0,.247-.247.245.245,0,0,0-.247-.247.255.255,0,0,0-.247.247.237.237,0,0,0,.247.247Z' transform='translate(-323.823 -279.22)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M192.647,872.695a.247.247,0,1,0-.247-.247.245.245,0,0,0,.247.247Z' transform='translate(-172.167 -749.332)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M542.948,937.295a.255.255,0,0,0,.247-.247.245.245,0,0,0-.247-.247.255.255,0,0,0-.247.247.245.245,0,0,0,.247.247Z' transform='translate(-471.477 -804.529)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1691.248,881.995a.247.247,0,1,0-.248-.247.255.255,0,0,0,.248.247Z' transform='translate(-1452.629 -757.278)' fill='%23fff' fill-rule='evenodd'/%3E%3Cpath d='M1331.448,644.195a.247.247,0,0,0,0-.495.247.247,0,0,0,0,.495Z' transform='translate(-1145.202 -554.093)' fill='%23fff' fill-rule='evenodd'/%3E%3C/g%3E%3C/svg%3E");
	cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><g transform="translate(-844 -500)"><g transform="translate(844 -520.36)"><path d="M194.787,1212.29a2.858,2.858,0,1,0,2.858,2.858,2.869,2.869,0,0,0-2.858-2.858Z" transform="translate(-174.792 -174.793)" fill="%23868686"/><path d="M209.416,1228.35a1.429,1.429,0,1,1-1.424,1.424,1.419,1.419,0,0,1,1.424-1.424Z" transform="translate(-189.421 -189.419)" fill="%23ff655b"/><g transform="translate(0 1020.36)"><path d="M216.024,1020.36v12.855h1.424V1020.36Z" transform="translate(-196.736 -1020.36)" fill="%23868686"/><path d="M216.024,1324.26v12.866h1.424V1324.26Z" transform="translate(-196.736 -1297.126)" fill="%23868686"/><path d="M304.016,1236.27v1.434h12.855v-1.434Z" transform="translate(-276.871 -1216.992)" fill="%23868686"/><path d="M0,1236.27v1.434H12.855v-1.434Z" transform="translate(0 -1216.992)" fill="%23868686"/></g><g transform="translate(8.861 1029.216)"><path d="M244.5,1119.548a.714.714,0,0,0-.12,1.409,10,10,0,0,1,7.4,7.391.715.715,0,0,0,1.391-.33v0a11.431,11.431,0,0,0-8.454-8.443.718.718,0,0,0-.212-.023Z" transform="translate(-230.918 -1119.547)" fill="%23868686"/><path d="M107.971,1119.589a.721.721,0,0,0-.19.023,11.428,11.428,0,0,0-8.44,8.427.714.714,0,0,0,1.379.369c0-.01.005-.021.008-.031a10,10,0,0,1,7.386-7.377.714.714,0,0,0-.142-1.409Z" transform="translate(-99.31 -1119.586)" fill="%23868686"/><path d="M252.407,1264.338a.714.714,0,0,0-.712.555,10,10,0,0,1-7.386,7.38.714.714,0,0,0,.282,1.4l.053-.013a11.43,11.43,0,0,0,8.44-8.429.713.713,0,0,0-.678-.893Z" transform="translate(-230.835 -1251.41)" fill="%23868686"/><path d="M99.924,1264.077a.714.714,0,0,0-.656.89,11.431,11.431,0,0,0,8.44,8.454.715.715,0,0,0,.335-1.39h0a9.995,9.995,0,0,1-7.386-7.4.714.714,0,0,0-.734-.558h0Z" transform="translate(-99.246 -1251.172)" fill="%23868686"/></g><g transform="translate(2 1022.36)" fill="none" stroke="%23707070" stroke-width="2"><circle cx="18" cy="18" r="18" stroke="none"/><circle cx="18" cy="18" r="17" fill="none"/></g></g></g></svg>') 16 16, auto;
}

.asteroid {
	width:40px;
	height:40px;
	background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg transform='translate(0 0)'%3E%3Cpath d='M230.994,11.742,221.867,22.4v2A14.671,14.671,0,0,0,236.3,12.366,25.741,25.741,0,0,0,230.994,11.742Z' transform='translate(-195.867 -10.366)' fill='%234a8dc6'/%3E%3Cpath d='M146.179,11.984l.035-.268a31.976,31.976,0,0,0-20.381,7.4,14.635,14.635,0,0,0,11.254,5.262v-2C141.56,22.375,145.383,18,146.179,11.984Z' transform='translate(-111.088 -10.34)' fill='%2377aad4'/%3E%3Cpath d='M241.059,24.221A10.663,10.663,0,0,0,233.9,7.441a22.167,22.167,0,0,0-8.472-4.913c.011-.057.022-.114.033-.171a2,2,0,0,0-3.936-.713,12.621,12.621,0,0,1-1.353,3.82l-12.81,51.886a10.663,10.663,0,0,0,17.178-4.719,35.188,35.188,0,0,0,4.576-3.339,4.666,4.666,0,0,0,5.2-5.506A31.8,31.8,0,0,0,241.059,24.221Z' transform='translate(-183.064 0)' fill='%23a5c6e3'/%3E%3Cpath d='M53.914,67.8c.528-6.259-1.372-11.9-5.351-15.875A18.917,18.917,0,0,0,37.11,46.619a12.672,12.672,0,0,1-20.83,2.026,2,2,0,1,0-3.068,2.567l.016.019q-.657.6-1.293,1.229a35.744,35.744,0,0,0-4.177,5.017A12.672,12.672,0,0,0,2.013,76.009,23.1,23.1,0,0,0,8.608,91.916,23.064,23.064,0,0,0,24.3,98.505a51.738,51.738,0,0,0,20.936-12.78A29.072,29.072,0,0,0,53.914,67.8Z' transform='translate(0 -41.156)' fill='%23d2e3f1'/%3E%3Cpath d='M267.378,364.089v13.333a6.667,6.667,0,0,0,0-13.333Z' transform='translate(-236.045 -321.423)' fill='%234a8dc6'/%3E%3Cpath d='M219.821,370.756c0-3.682-1.194-6.667-2.667-6.667a6.667,6.667,0,0,0,0,13.333C218.628,377.422,219.821,374.438,219.821,370.756Z' transform='translate(-185.821 -321.423)' fill='%2377aad4'/%3E%3Cpath d='M420.978,96.711v13.333a6.667,6.667,0,0,0,0-13.333Z' transform='translate(-371.645 -85.378)' fill='%234a8dc6'/%3E%3Cpath d='M373.421,103.378c0-3.682-1.194-6.667-2.667-6.667a6.667,6.667,0,1,0,0,13.333C372.228,110.044,373.421,107.06,373.421,103.378Z' transform='translate(-321.421 -85.378)' fill='%2377aad4'/%3E%3Cg transform='translate(15.667 25)'%3E%3Ccircle cx='1' cy='1' r='1' transform='translate(13.333 4)' fill='%23a5c6e3'/%3E%3Ccircle cx='1' cy='1' r='1' transform='translate(17.333)' fill='%23a5c6e3'/%3E%3Ccircle cx='1' cy='1' r='1' transform='translate(28 12.667)' fill='%23a5c6e3'/%3E%3Ccircle cx='1' cy='1' r='1' transform='translate(0 24.667)' fill='%23a5c6e3'/%3E%3C/g%3E%3Cpath d='M108.089,164.978v17.333a8.667,8.667,0,1,0,0-17.333Z' transform='translate(-95.422 -145.645)' fill='%234a8dc6'/%3E%3Cpath d='M47.466,173.644c0-4.786-2.089-8.667-4.667-8.667a8.667,8.667,0,1,0,0,17.333C45.377,182.31,47.466,178.43,47.466,173.644Z' transform='translate(-30.133 -145.644)' fill='%2377aad4'/%3E%3C/g%3E%3C/svg%3E");
	background-size:contain;
	background-repeat:no-repeat;
}
.spaceship {
	width:36px;
	height:46px;
	background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='26.342' height='36' viewBox='0 0 26.342 36'%3E%3Cg transform='translate(-123.583 0)'%3E%3Cpath d='M136.755,150.063l-12.512,10.01a1.756,1.756,0,0,0-.659,1.371v4.424l13.171-2.634,13.171,2.634v-4.424a1.756,1.756,0,0,0-.659-1.371Z' transform='translate(-0.001 -135.137)' fill='%23ff6464'/%3E%3Cpath d='M220.616,313.138l-1.044-4.177h-6.64l-1.044,4.177a.878.878,0,0,0,.852,1.091h7.025a.878.878,0,0,0,.852-1.091Z' transform='translate(-79.498 -278.23)' fill='%23959cb3'/%3E%3Cpath d='M214.523,313.138l1.044-4.177h-2.634l-1.044,4.177a.878.878,0,0,0,.852,1.091h2.634a.878.878,0,0,1-.852-1.091Z' transform='translate(-79.498 -278.23)' fill='%23707487'/%3E%3Cpath d='M207.569.429,203.48,7.736a3.513,3.513,0,0,0-.447,1.715V30.732a1.756,1.756,0,0,0,1.756,1.756h7.025a1.756,1.756,0,0,0,1.756-1.756V9.45a3.511,3.511,0,0,0-.447-1.715L209.034.429A.839.839,0,0,0,207.569.429Z' transform='translate(-71.547 0)' fill='%23e4eaf6'/%3E%3Cpath d='M206.545,30.781V9.5a7.658,7.658,0,0,1,.186-1.715l1.7-7.307a1.111,1.111,0,0,1,.157-.371.833.833,0,0,0-1.023.371L203.48,7.785a3.513,3.513,0,0,0-.447,1.715V30.781a1.756,1.756,0,0,0,1.756,1.756h2.488C206.873,32.537,206.545,31.751,206.545,30.781Z' transform='translate(-71.547 -0.049)' fill='%23c7cfe2'/%3E%3Cpath d='M209.035.43a.839.839,0,0,0-1.464,0l-4.089,7.307a3.513,3.513,0,0,0-.447,1.715v4.6h10.537v-4.6a3.511,3.511,0,0,0-.447-1.715Z' transform='translate(-71.548 -0.001)' fill='%23ff6464'/%3E%3Cpath d='M206.546,9.512a7.658,7.658,0,0,1,.186-1.715l1.7-7.307a1.111,1.111,0,0,1,.157-.371.86.86,0,0,0-.553-.012c-.013,0-.026.011-.039.016a.812.812,0,0,0-.193.106c-.019.014-.038.027-.056.043a.821.821,0,0,0-.182.218L203.481,7.8a3.513,3.513,0,0,0-.447,1.715v4.6h3.512Z' transform='translate(-71.548 -0.061)' fill='%23d2555a'/%3E%3Cpath d='M213.571,141.235H203.034v1.756h2.252a3.469,3.469,0,0,0,6.034,0h2.252v-1.756Z' transform='translate(-71.548 -127.187)' fill='%23c7cfe2'/%3E%3Ccircle cx='1.756' cy='1.756' r='1.756' transform='translate(134.999 12.292)' fill='%235b5d6e'/%3E%3Cpath d='M206.546,144.266v-3.032h-3.512v1.756h2.252A3.551,3.551,0,0,0,206.546,144.266Z' transform='translate(-71.548 -127.186)' fill='%23afb9d2'/%3E%3Cpath d='M219.677.429l-3.2,5.716h7.863l-3.2-5.716A.839.839,0,0,0,219.677.429Z' transform='translate(-83.655 0)' fill='%23707487'/%3E%3Cpath d='M219.211,6.206,220.544.489A1.111,1.111,0,0,1,220.7.118a.86.86,0,0,0-.553-.012l-.011,0-.028.011a.812.812,0,0,0-.193.106l-.02.015c-.012.009-.025.018-.037.028a.823.823,0,0,0-.182.218l-3.2,5.716h2.732Z' transform='translate(-83.656 -0.06)' fill='%235b5d6e'/%3E%3Cg transform='translate(123.583 25.463)'%3E%3Cpath d='M123.584,261.264l7.9-1.581V256l-7.9,2.107Z' transform='translate(-123.584 -255.996)' fill='%23d2555a'/%3E%3Cpath d='M316.87,261.264l-7.9-1.581V256l7.9,2.107Z' transform='translate(-290.527 -255.996)' fill='%23d2555a'/%3E%3C/g%3E%3Cg transform='translate(123.583 25.463)'%3E%3Cpath d='M124.462,264.824h0a.878.878,0,0,0-.878.878v7.025a.878.878,0,0,0,.878.878h0a.878.878,0,0,0,.878-.878V265.7A.878.878,0,0,0,124.462,264.824Z' transform='translate(-123.584 -263.946)' fill='%23afb9d2'/%3E%3Cpath d='M159.773,256h0a.878.878,0,0,0-.878.878v4.39a.878.878,0,0,0,.878.878h0a.878.878,0,0,0,.878-.878v-4.39A.878.878,0,0,0,159.773,256Z' transform='translate(-155.383 -255.996)' fill='%23afb9d2'/%3E%3Cpath d='M371.639,264.824h0a.878.878,0,0,1,.878.878v7.025a.878.878,0,0,1-.878.878h0a.878.878,0,0,1-.878-.878V265.7A.878.878,0,0,1,371.639,264.824Z' transform='translate(-346.175 -263.946)' fill='%23afb9d2'/%3E%3Cpath d='M336.328,256h0a.878.878,0,0,1,.878.878v4.39a.878.878,0,0,1-.878.878h0a.878.878,0,0,1-.878-.878v-4.39A.878.878,0,0,1,336.328,256Z' transform='translate(-314.376 -255.996)' fill='%23afb9d2'/%3E%3C/g%3E%3Cg transform='translate(123.583 25.446)'%3E%3Ccircle cx='0.895' cy='0.895' r='0.895' transform='translate(0 0.862)' fill='%23959cb3'/%3E%3Ccircle cx='0.895' cy='0.895' r='0.895' transform='translate(3.496)' fill='%23959cb3'/%3E%3Ccircle cx='0.895' cy='0.895' r='0.895' transform='translate(24.552 0.862)' fill='%23959cb3'/%3E%3Ccircle cx='0.895' cy='0.895' r='0.895' transform='translate(21.057)' fill='%23959cb3'/%3E%3C/g%3E%3Cg transform='translate(135.876 23.707)'%3E%3Cpath d='M248.05,243.608h0a.878.878,0,0,0,.878-.878v-3.512a.878.878,0,0,0-.878-.878h0a.878.878,0,0,0-.878.878v3.512A.878.878,0,0,0,248.05,243.608Z' transform='translate(-247.172 -238.34)' fill='%23c7cfe2'/%3E%3Cpath d='M274.534,243.608h0a.878.878,0,0,0,.878-.878v-3.512a.878.878,0,0,0-.878-.878h0a.878.878,0,0,0-.878.878v3.512A.878.878,0,0,0,274.534,243.608Z' transform='translate(-271.022 -238.34)' fill='%23c7cfe2'/%3E%3C/g%3E%3Cpath d='M221.567,243.608h0a.878.878,0,0,0,.878-.878v-3.512a.878.878,0,0,0-.878-.878h0a.878.878,0,0,0-.878.878v3.512A.878.878,0,0,0,221.567,243.608Z' transform='translate(-87.447 -214.633)' fill='%23afb9d2'/%3E%3C/g%3E%3C/svg%3E");
	background-size:contain;
	background-repeat:no-repeat;
}

.asteroid.active {
	width:60px;
	height:60px;
	background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='65' height='64' viewBox='0 0 65 64'%3E%3Cg transform='translate(-1003 -490)'%3E%3Ccircle cx='23.5' cy='23.5' r='23.5' transform='translate(1009 502)' fill='%23d2e3f1'/%3E%3Ccircle cx='9' cy='9' r='9' transform='translate(1009 502)' fill='%23d2e3f1'/%3E%3Ccircle cx='12' cy='12' r='12' transform='translate(1021 490)' fill='%23d2e3f1'/%3E%3Ccircle cx='12' cy='12' r='12' transform='translate(1033 499)' fill='%23d2e3f1'/%3E%3Ccircle cx='12' cy='12' r='12' transform='translate(1003 520)' fill='%23d2e3f1'/%3E%3Ccircle cx='12' cy='12' r='12' transform='translate(1033 530)' fill='%23d2e3f1'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1048 523)' fill='%23d2e3f1'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1010 523)' fill='%234a8dc6'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1015 514)' fill='%234a8dc6'/%3E%3Ccircle cx='18' cy='18' r='18' transform='translate(1018 504)' fill='%234a8dc6'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1010 523)' fill='%234a8dc6'/%3E%3Ccircle cx='4.5' cy='4.5' r='4.5' transform='translate(1059 513)' fill='%23d2e3f1'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1036 533)' fill='%234a8dc6'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1027 499)' fill='%234a8dc6'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1020 518)' fill='%2377aad4'/%3E%3Ccircle cx='7.5' cy='7.5' r='7.5' transform='translate(1033 507)' fill='%2377aad4'/%3E%3Ccircle cx='5.5' cy='5.5' r='5.5' transform='translate(1037 527)' fill='%2377aad4'/%3E%3Ccircle cx='4' cy='4' r='4' transform='translate(1037 527)' fill='%23fff'/%3E%3Ccircle cx='4' cy='4' r='4' transform='translate(1026 520)' fill='%23fff'/%3E%3Ccircle cx='4' cy='4' r='4' transform='translate(1040 511)' fill='%23fff'/%3E%3C/g%3E%3C/svg%3E");
	background-size:contain;
	background-repeat:no-repeat;
}
</style>