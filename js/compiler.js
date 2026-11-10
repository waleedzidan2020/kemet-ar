(()=>{'use strict';const $=s=>document.querySelector(s);let source='preset',mindBuffer=null,working=false;
function updateStatus(text,number){$('#progressStatus').textContent=text;if(typeof number==='number'){const n=Math.max(0,Math.min(100,number));$('#progressNumber').textContent=Math.round(n)+'%';$('#progressFill').style.width=n+'%'}}
$('#presetTab').addEventListener('click',()=>setSource('preset'));$('#uploadTab').addEventListener('click',()=>setSource('upload'));
function setSource(v){source=v;$('#presetTab').classList.toggle('selected',v==='preset');$('#uploadTab').classList.toggle('selected',v==='upload');$('#presets').hidden=v!=='preset';$('#uploadBox').hidden=v!=='upload';mindBuffer=null;$('#downloadButton').disabled=true;updateStatus('جاهز لمعالجة الصور',0)}
$('#customFiles').addEventListener('change',e=>{const files=[...e.target.files];$('#fileNames').textContent=files.length?files.map(f=>f.name).join(' • '):'';mindBuffer=null;$('#downloadButton').disabled=true});
async function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('تعذر تحميل الصورة '+src));img.src=src})}
async function imagesFromFiles(files){const images=[];for(const file of files){const url=URL.createObjectURL(file);try{images.push(await loadImage(url))}finally{URL.revokeObjectURL(url)}}return images}
async function compile(){if(working)return;let files;try{
 files=source==='upload'?[...$('#customFiles').files]:null;if(files&&(!files.length||files.length>4))throw Error('اختر من صورة إلى أربع صور فقط.');if(files&&files.some(f=>!f.type.startsWith('image/')))throw Error('الملفات لازم تكون صور JPG أو PNG.');
 const Core=window.MINDAR?.IMAGE?.Compiler||window.MINDAR?.Compiler;
 if(!Core)throw Error('مكتبة MindAR Compiler لم تُحمّل. جرّب تحديث الصفحة أو استخدم رابط المترجم الرسمي الموجود في الأسفل.');
 working=true;$('#compileButton').disabled=true;$('#downloadButton').disabled=true;mindBuffer=null;updateStatus('جاري تحميل الصور المرجعية...',2);
 const imgs=files?await imagesFromFiles(files):await Promise.all([1,2,3,4].map(i=>loadImage('assets/scene-'+i+'-original.jpg')));
 // Image target compiler may use substantial GPU memory, especially for large images.
 const compiler=new Core();updateStatus('جاري استخراج الخصائص البصرية...',5);
 await compiler.compileImageTargets(imgs,progress=>{let percent=Number(progress);if(percent<=1)percent*=100;updateStatus('جاري استخراج الخصائص البصرية...',Math.max(5,Math.min(96,percent)))});
 mindBuffer=await compiler.exportData();if(!mindBuffer||!mindBuffer.byteLength)throw Error('ملف التعرف الناتج فارغ.');
 updateStatus('تم تجهيز targets.mind بنجاح — '+imgs.length+' صورة',100);$('#downloadButton').disabled=false;
 }catch(e){console.error(e);updateStatus('تعذّر الإعداد: '+e.message,0)}finally{working=false;$('#compileButton').disabled=false}}
$('#compileButton').addEventListener('click',compile);
$('#downloadButton').addEventListener('click',()=>{if(!mindBuffer)return;const blob=new Blob([mindBuffer],{type:'application/octet-stream'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='targets.mind';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000)});
})();
