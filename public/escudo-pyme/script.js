const controls=[
 {title:'Activar autenticación de dos factores (MFA)',desc:'Protege correos y cuentas críticas.',priority:'Alta',state:'Completado',verified:true},
 {title:'Configurar copias de seguridad automáticas',desc:'Reduce el impacto de pérdida de archivos.',priority:'Alta',state:'Pendiente',verified:false},
 {title:'Revisar accesos de empleados',desc:'Confirma que solo las personas correctas tengan acceso.',priority:'Media',state:'En proceso',verified:false},
 {title:'Proteger dispositivos',desc:'Mantén equipos actualizados y con bloqueo de pantalla.',priority:'Media',state:'Pendiente',verified:false},
 {title:'Revisar proveedor de TI',desc:'Confirma responsabilidades y canal de escalamiento.',priority:'Media',state:'Pendiente',verified:false}
];
const steps=['Confirmar y contener','Preservar evidencia','Identificar datos afectados','Comunicación','Cierre'];let stepIndex=0;
const titleMap={home:'Tu Escudo PyME',shield:'Mi Escudo',incident:'Modo incidente',coordinator:'Coordinador'};
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active-screen'));document.getElementById(id).classList.add('active-screen');document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.screen===id));document.getElementById('page-title').textContent=titleMap[id];window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('[data-screen]').forEach(b=>b.addEventListener('click',()=>showScreen(b.dataset.screen)));
function renderControls(){document.getElementById('controls').innerHTML=controls.map((c,i)=>`<article class="control"><div class="control-num">${i+1}</div><div><h3>${c.title}</h3><p>${c.desc}</p></div><div><span class="priority">${c.priority}</span><div class="${c.verified?'done':'pending'}">${c.verified?'✓ '+c.state:'○ '+c.state}</div></div></article>`).join('')}
function renderSteps(){document.getElementById('steps').innerHTML=steps.map((s,i)=>`<div class="step ${i<stepIndex?'done':''} ${i===stepIndex?'active':''}">${i+1}. ${s}</div>`).join('')}
document.getElementById('advance').addEventListener('click',()=>{if(stepIndex<steps.length-1){stepIndex++;renderSteps();toast('Paso revisado. Siguiente responsable: coordinador humano.')}else{toast('Flujo simulado listo para cierre humano.')}});
document.getElementById('close-case').addEventListener('click',()=>toast('Cierre simulado registrado. Requiere validación humana.'));
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2600)}
renderControls();renderSteps();
