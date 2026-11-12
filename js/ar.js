(()=>{'use strict';
const $=s=>document.querySelector(s);
const mode='custom';
const reliefs=[['legacy-relief.mind','test-relief-color.png'],['royal-offering.mind','royal-offering-color.png'],['offering-symbols.mind','offering-symbols.jpg']];
let overlays=[];
async function loadOverlayDimensions(){
 if(mode==='demo')return;
 overlays=await Promise.all(reliefs.map(async ([,name])=>{
  const img=new Image();
  await new Promise((ok,fail)=>{img.onload=ok;img.onerror=()=>fail(Error(tr('errOverlay')));img.src='assets/'+name;});
  return [img.naturalHeight/img.naturalWidth,name];
 }));
}
let language=localStorage.getItem('kemet-lang')==='en'?'en':'ar';
let locked=false,lockedIndex=-1;
let sceneEl=null,currentIndex=-1,found=false,showOverlay=true,desiredOpacity=1,animationFrame=0,mindUrl=null;
const DEMO_MIND='https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind';
const descriptions={ar:[
 ['المشهد الملكي','تصور ملون فوق رسم توثيقي. الألوان ليست توثيقًا لألوان الأثر الأصلية.'],
 ['مشهد التقدمة','تظهر هيئة ملكية تقدم قربانًا في حضور شخصيات أخرى. تتطلب الهوية والترجمة مراجعة أثرية.'],
 ['سوبك والطقوس','تظهر هيئة إله برأس تمساح، وقد تكون لسوبك. الجزء المفقود يحتاج دليلًا أثريًا لاستكماله.'],
 ['سوبك والملك','مشهد طقسي آخر بإله ذي رأس تمساح وملك يحمل قربانًا؛ تفاصيل التلوين توضيحية فقط.']
 ],en:[
 ['Royal relief','A color visualization on the source line drawing. Colors are not confirmed historic pigments.'],
 ['Offering scene','A royal figure presents an offering among other figures. Historical identification and translation require review.'],
 ['Sobek & ritual','A crocodile-headed deity, possibly Sobek. Missing areas require documentary evidence for reliable restoration.'],
 ['Sobek & king','Another ritual scene involving a crocodile-headed deity and an offering figure. The colors are illustrative.']
 ]};
const strings={ar:{welcomeTitle:'اكتشف ألوان الماضي',welcomeDesc:'ابدأ الكاميرا ووجّهها لصورة مرجعية. ستظهر طبقة رقمية فوق الهدف عند التعرف عليه.',demoHelpTitle:'هدف التجربة الجاهزة',demoHelpText:'هذه تجربة تتعرف على بطاقة MindAR الرسمية، وليست على النقوش المصرية. افتح صورة البطاقة على شاشة ثانية أو اطبعها.',demoTargetLink:'افتح صورة الهدف ↗',chooseMindLabel:'اختيار ملف التعرف targets.mind (اختياري لو وضعته في assets)',customHelpText:'للتعرف على رسوماتك، جهّز ملف targets.mind من الصور المرجعية الأربع بالترتيب.',compilerLink:'جهّز ملف التعرف ↗',startLabel:'تشغيل الكاميرا',backHome:'رجوع للمعرض',demoModeLink:'الوضع التجريبي',customModeLink:'نقوشك الأربعة',welcomeDisclaimer:'تحتاج الكاميرا إلى HTTPS أو localhost. يرجى السماح بالوصول للكاميرا.',trackingIdle:'لم تبدأ الكاميرا بعد',trackingScan:'وجّه الكاميرا إلى الهدف',trackingFound:'تم التعرف على الصورة ✓',trackingLost:'فُقد الهدف — وجه الكاميرا مجددًا',trackingLoading:'جاري تهيئة الكاميرا...',demoScene:'بطاقة MindAR التجريبية',sceneCaption:'تصور ترميم رقمي تعليمي',infoLabel:'الشرح',opacityLabel:'شدة التلوين',originalLabel:'إظهار الأصل',restoreLabel:'إظهار الألوان',revealLabel:'إحياء الألوان',stopLabel:'إيقاف',infoHeading:'ملاحظات المرشد',infoBody:'التلوين معروض لأغراض الشرح فقط. تأكد من هوية النقش ومن مراجعة الألوان والنصوص مع مختص آثار.',speakLabel:'استمع للشرح',errLib:'تعذر تحميل مكتبات الواقع المعزز. تأكد من اتصال الإنترنت وأعد تحميل الصفحة.',errSecure:'الكاميرا تتطلب رابط HTTPS أو localhost، ولا تعمل عادة عند فتح الملف مباشرة.',errMind:'لم نعثر على targets.mind. أنشئه من صفحة تجهيز النقوش، ثم اختره هنا أو ضعه داخل مجلد assets وارفع الموقع مرة أخرى.',errCamera:'تعذّر تشغيل الكاميرا. تأكد من السماح للمتصفح باستخدام الكاميرا، ثم حاول مجددًا.'},en:{welcomeTitle:'Discover the colors of history',welcomeDesc:'Start the camera and point it at a reference image. A digital overlay will appear once the image is recognized.',demoHelpTitle:'Ready-made demo target',demoHelpText:'This recognizes the official MindAR example card, not an Egyptian relief. Display the target on another screen or print it.',demoTargetLink:'Open target image ↗',chooseMindLabel:'Select targets.mind (optional if already in assets)',customHelpText:'Compile your own targets.mind using the four source drawings, in the correct order.',compilerLink:'Build tracking file ↗',startLabel:'Start camera',backHome:'Back to gallery',demoModeLink:'Demo mode',customModeLink:'Your four reliefs',welcomeDisclaimer:'Camera access requires HTTPS or localhost. Please grant camera permission.',trackingIdle:'Camera not started',trackingScan:'Aim the camera at the target',trackingFound:'Image recognized ✓',trackingLost:'Target lost — point the camera again',trackingLoading:'Starting camera...',demoScene:'MindAR sample card',sceneCaption:'Educational digital reconstruction',infoLabel:'Guide notes',opacityLabel:'Color intensity',originalLabel:'Show original',restoreLabel:'Show colors',revealLabel:'Reveal colors',stopLabel:'Stop',infoHeading:'Tour guide notes',infoBody:'Colors are illustrative, not historically verified. Confirm the relief identification and epigraphy with qualified specialists.',speakLabel:'Listen to narration',errLib:'AR libraries could not be loaded. Check your internet connection and reload.',errSecure:'The camera requires HTTPS or localhost and may not work when opening the file directly.',errMind:'No targets.mind file was found. Build one from the compiler page, then select it here or add it under assets and redeploy.',errCamera:'Camera startup failed. Grant camera permission in your browser and try again.'}};
descriptions.ar = [['تجربة صورتك الملونة','تصور ملون للصورة الأصلية التي رفعتها. الألوان توضيحية وليست توثيقًا للأصباغ الأصلية.']];
descriptions.en = [['Your relief — color test','A color visualization of your original photograph. Colors are illustrative.']];
Object.assign(strings.ar,{customHelpText:'ملف التعرف جاهز. اعرض الصورة الأصلية على شاشة ثانية أو اطبعها، ووجّه كاميرا الموبايل إليها.',customModeLink:'تجربة صورتك',chooseMindLabel:'ملف التعرف مرفق — اختيار ملف بديل اختياري',compilerLink:'تجهيز هدف آخر ↗'});
Object.assign(strings.en,{customHelpText:'Tracking is ready. Display the original photo on another screen or print it, then aim your phone camera at it.',customModeLink:'Your photo test',chooseMindLabel:'Tracking file included — optional replacement',compilerLink:'Build another target ↗'});
Object.assign(strings.ar,{lockLabel:'تثبيت المنظر',unlockLabel:'إلغاء التثبيت',trackingLocked:'المنظر مثبت — اضغط إلغاء التثبيت للعودة للكاميرا',lockHint:'وجّه الكاميرا للنقش وأظهر الألوان أولًا',errCapture:'تعذر تثبيت المنظر. أبقِ النقش ظاهرًا وحاول مجددًا.'});
Object.assign(strings.en,{lockLabel:'Lock view',unlockLabel:'Unlock view',trackingLocked:'View locked — unlock to return to the live camera',lockHint:'Find a target and show its colors first',errCapture:'Could not lock the view. Keep the target visible and try again.'});
descriptions.ar.push(['مشهد التقدمة الملكية','تصور لوني لمشهد التقدمة الملكية.']);
descriptions.en.push(['Royal offering relief','A color visualization of the offering scene.']);
Object.assign(strings.ar,{customHelpText:'وجّه الكاميرا لأي نقش من النقوش الثلاثة وانتقل بينها لرؤية التلوين.',customModeLink:'مشهد التقدمة الجديد',errOverlay:'تعذر تحميل الصورة الملونة. تأكد من اتصال الإنترنت وحاول مجددًا.'});
Object.assign(strings.en,{customHelpText:'The tracking file for the selected scene is included. Aim at the relief or the reference photo used to compile it.',customModeLink:'New offering scene',errOverlay:'Could not load the colored image. Check your connection and try again.'});
descriptions.ar.push(['نقش القرابين','تصور ملون للرموز المنحوتة في مشهد القرابين.']);
descriptions.en.push(['Offering symbols','A color visualization of the carved offering symbols.']);
const tr=k=>strings[language][k];
function syncLockControls(){
 const btn=$('#lockView');btn.disabled=!locked&&(!found||!showOverlay||!sceneEl);
 btn.setAttribute('aria-pressed',String(locked));btn.classList.toggle('active',locked);
 $('#lockLabel').textContent=tr(locked?'unlockLabel':'lockLabel');$('#lockIcon').textContent=locked?'🔓':'🔒';
 btn.title=btn.disabled?tr('lockHint'):tr(locked?'unlockLabel':'lockLabel');
 $('#frozenView').setAttribute('aria-label',tr('trackingLocked'));
 ['showOriginal','revealAgain','opacitySlider'].forEach(id=>$('#'+id).disabled=locked);
}
function unlockView(){
 locked=false;lockedIndex=-1;const canvas=$('#frozenView');canvas.hidden=true;canvas.width=canvas.height=0;
 syncLockControls();$('#scanGuide').classList.toggle('active',!!sceneEl&&!found);
 status(found?'trackingFound':sceneEl?'trackingScan':'trackingIdle',found);updateInfo();
}
function toggleLock(){
 if(locked){unlockView();return;}
 if(!sceneEl||!found||!showOverlay)return;
 const canvas=$('#frozenView');
 try{
  const video=sceneEl.systems['mindar-image-system']?.video||$('#arMount video');
  const renderer=sceneEl.renderer;
  if(!video||video.readyState<2||!renderer||!sceneEl.camera)throw Error('Camera frame unavailable');
  const bounds=$('#arMount').getBoundingClientRect();
  if(!bounds.width||!bounds.height)throw Error('Empty camera viewport');
  const scale=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(bounds.width*scale);canvas.height=Math.round(bounds.height*scale);
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
  ctx.scale(scale,scale);ctx.fillStyle='#051018';ctx.fillRect(0,0,bounds.width,bounds.height);
  // MindAR sizes and centers its video and WebGL canvas; preserve those crop rectangles.
  const draw=source=>{const r=source.getBoundingClientRect();ctx.drawImage(source,r.left-bounds.left,r.top-bounds.top,r.width,r.height);};
  cancelAnimationFrame(animationFrame);applyOpacity();
  renderer.render(sceneEl.object3D,sceneEl.camera);
  draw(video);draw(renderer.domElement);
  lockedIndex=currentIndex;locked=true;canvas.hidden=false;
  $('#scanGuide').classList.remove('active');syncLockControls();status('trackingLocked',true);updateInfo();
 }catch(e){console.error(e);canvas.hidden=true;canvas.width=canvas.height=0;error(tr('errCapture'));}
}

function renderLang(){document.documentElement.lang=language;document.documentElement.dir=language==='ar'?'rtl':'ltr';localStorage.setItem('kemet-lang',language);$('#langButton').textContent=language==='ar'?'EN':'عربي';['welcomeTitle','welcomeDesc','chooseMindLabel','customHelpText','startLabel','welcomeDisclaimer','infoLabel','opacityLabel','revealLabel','stopLabel','infoHeading','speakLabel'].forEach(id=>$('#'+id).textContent=tr(id));$('#modeBadge').textContent=mode==='demo'?'MINDAR DEMO':'KEMET AR';$('#customExplainer').hidden=mode!=='custom';$('#sceneCaption').textContent=tr('sceneCaption');$('#originalLabel').textContent=showOverlay?tr('originalLabel'):tr('restoreLabel');$('#trackingText').textContent=found?tr('trackingFound'):sceneEl?tr('trackingScan'):tr('trackingIdle');updateInfo();syncLockControls();if(locked)status('trackingLocked',true)}
function updateInfo(){const d=mode==='demo'?[tr('demoScene'),tr('infoBody')]:descriptions[language][Math.max(0,locked?lockedIndex:currentIndex)];$('#sceneName').textContent=d[0];$('#infoBody').textContent=d[1]}
function status(key,success=false){syncLockControls();if(locked){key='trackingLocked';success=true;}$('#trackingText').textContent=tr(key);$('#trackingState').classList.toggle('success',success)}
let errorTimer=0;function error(message){const box=$('#errorToast');box.textContent=message;box.hidden=false;clearTimeout(errorTimer);errorTimer=setTimeout(()=>box.hidden=true,9000)}
async function getMindUrl(){
 if(mode==='demo')return DEMO_MIND;
 // MindAR v2 MessagePack envelope: {v:2,dataList:[target]}.
 const header=Uint8Array.of(0x82,0xa1,118,2,0xa8,100,97,116,97,76,105,115,116,0x91);
 const entries=await Promise.all(reliefs.map(async ([name])=>{
  const response=await fetch('assets/'+name);
  if(!response.ok)throw Error(tr('errMind'));
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(bytes.length<=header.length||!header.every((v,i)=>bytes[i]===v))throw Error(tr('errMind'));
  return bytes.subarray(header.length);
 }));
 header[header.length-1]=0x90+entries.length;
 return URL.createObjectURL(new Blob([header,...entries],{type:'application/octet-stream'}));
}
function setOpacity(num){desiredOpacity=Number(num)/100;$('#opacityNum').textContent=num+'%';applyOpacity()}
function applyOpacity(){if(!sceneEl||!found)return;const item=$('#plane-'+currentIndex);if(item)item.setAttribute('material','opacity',showOverlay?desiredOpacity:0)}
function animateOverlay(){if(!found||!sceneEl)return;cancelAnimationFrame(animationFrame);showOverlay=true;syncLockControls();$('#originalLabel').textContent=tr('originalLabel');$('#showOriginal').classList.remove('active');const plane=$('#plane-'+currentIndex);if(!plane)return;const begin=performance.now(),dur=1800;function tick(now){if(!found)return;let ratio=Math.min(1,(now-begin)/dur);ratio=ratio*ratio*(3-2*ratio);plane.setAttribute('material','opacity',ratio*desiredOpacity);if(ratio<1)animationFrame=requestAnimationFrame(tick)}animationFrame=requestAnimationFrame(tick)}
function startScene(targetSrc){const demo=mode==='demo',meta=demo?[[.552,'demo-overlay.png']]:overlays;const assets=meta.map((x,i)=>`<img id="texture-${i}" src="assets/${x[1]}" crossorigin="anonymous">`).join('');const targets=meta.map((x,i)=>`<a-entity id="target-${i}" mindar-image-target="targetIndex: ${i}"><a-plane id="plane-${i}" src="#texture-${i}" position="0 0 0.004" width="1" height="${x[0]}" material="shader: flat; transparent: true; opacity: 0; depthWrite: false; side: double; alphaTest: 0.001"></a-plane></a-entity>`).join('');const safeSrc=targetSrc.replaceAll('"','&quot;');$('#arMount').innerHTML=`<a-scene id="scene" mindar-image="imageTargetSrc: ${safeSrc}; autoStart: false; uiLoading: no; uiScanning: no; uiError: no; filterMinCF: 0.0001; filterBeta: 0.01;" embedded color-space="sRGB" renderer="colorManagement: true, physicallyCorrectLights" vr-mode-ui="enabled: false" device-orientation-permission-ui="enabled: false"><a-assets timeout="25000">${assets}</a-assets><a-camera position="0 0 0" look-controls="enabled: false"></a-camera>${targets}</a-scene>`;sceneEl=$('#scene');meta.forEach((_,i)=>{const target=$('#target-'+i);target.addEventListener('targetFound',()=>{currentIndex=i;found=true;status('trackingFound',true);$('#scanGuide').classList.remove('active');$('#infoSheet').hidden=true;updateInfo();animateOverlay()});target.addEventListener('targetLost',()=>{if(currentIndex!==i)return;cancelAnimationFrame(animationFrame);found=false;currentIndex=-1;status('trackingLost');$('#scanGuide').classList.toggle('active',!locked);updateInfo()})});sceneEl.addEventListener('arError',e=>{console.error(e);error(tr('errCamera'))});return sceneEl}
function sceneLoaded(scene){if(scene.hasLoaded)return Promise.resolve();return Promise.race([new Promise(res=>scene.addEventListener('loaded',res,{once:true})),new Promise((_,rej)=>setTimeout(()=>rej(Error('Scene load timeout')),30000))])}
async function start(){const btn=$('#startCamera');btn.disabled=true;status('trackingLoading');try{if(!window.isSecureContext&&location.hostname!=='localhost'&&location.hostname!=='127.0.0.1')throw Error(tr('errSecure'));if(!window.AFRAME||!AFRAME.components['mindar-image'])throw Error(tr('errLib'));mindUrl=await getMindUrl();await loadOverlayDimensions();const scene=startScene(mindUrl);await sceneLoaded(scene);if(!scene.systems['mindar-image-system'])throw Error(tr('errLib'));await scene.systems['mindar-image-system'].start();$('#welcome').hidden=true;$('#arControls').hidden=false;$('#scanGuide').classList.add('active');$('.ambient').classList.add('hidden');status('trackingScan');}catch(e){console.error(e);error(e.message||tr('errCamera'));btn.disabled=false;status('trackingIdle');if(sceneEl){try{await sceneEl.systems['mindar-image-system']?.stop()}catch(err){}if(mindUrl?.startsWith('blob:'))URL.revokeObjectURL(mindUrl);mindUrl=null;$('#arMount').innerHTML='';sceneEl=null}}}
async function stop(){unlockView();cancelAnimationFrame(animationFrame);if('speechSynthesis' in window)speechSynthesis.cancel();try{await sceneEl?.systems['mindar-image-system']?.stop()}catch(e){console.error(e)}if(mindUrl?.startsWith('blob:'))URL.revokeObjectURL(mindUrl);mindUrl=null;$('#arMount').innerHTML='';sceneEl=null;found=false;currentIndex=-1;$('#welcome').hidden=false;$('#startCamera').disabled=false;$('#arControls').hidden=true;$('#infoSheet').hidden=true;$('#scanGuide').classList.remove('active');$('.ambient').classList.remove('hidden');status('trackingIdle')}
$('#lockView').addEventListener('click',toggleLock);
$('#startCamera').addEventListener('click',start);
$('#stopCamera').addEventListener('click',stop);
$('#showOriginal').addEventListener('click',()=>{showOverlay=!showOverlay;cancelAnimationFrame(animationFrame);applyOpacity();$('#originalLabel').textContent=showOverlay?tr('originalLabel'):tr('restoreLabel');$('#showOriginal').classList.toggle('active',!showOverlay);syncLockControls()});
$('#revealAgain').addEventListener('click',animateOverlay);
$('#opacitySlider').addEventListener('input',e=>setOpacity(e.target.value));
$('#infoToggle').addEventListener('click',()=>{$('#infoSheet').hidden=!$('#infoSheet').hidden;$('#infoToggle').setAttribute('aria-expanded',String(!$('#infoSheet').hidden))});
$('#infoClose').addEventListener('click',()=>{$('#infoSheet').hidden=true;$('#infoToggle').setAttribute('aria-expanded','false')});
$('#langButton').addEventListener('click',()=>{language=language==='ar'?'en':'ar';renderLang()});
$('#speakInfo').addEventListener('click',()=>{if(!('speechSynthesis' in window))return;speechSynthesis.cancel();const utter=new SpeechSynthesisUtterance($('#infoBody').textContent);utter.lang=language==='ar'?'ar-EG':'en-US';utter.rate=.92;speechSynthesis.speak(utter)});
window.addEventListener('beforeunload',()=>{if('speechSynthesis' in window)speechSynthesis.cancel()});renderLang();
})();

