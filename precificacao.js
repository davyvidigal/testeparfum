(()=>{
const $=id=>document.getElementById(id), money=n=>Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const ids=['pricing-cost','pricing-extra','pricing-fee','pricing-margin','pricing-units'];
function products(){try{return JSON.parse(localStorage.getItem('parfumvidigal_products')||'[]')||[]}catch{return []}}
function fixed(){try{return JSON.parse(localStorage.getItem('parfumvidigal_fixed_expenses')||'[]')||[]}catch{return []}}
function update(){
 const cost=Math.max(0,Number($('pricing-cost').value)||0),extra=Math.max(0,Number($('pricing-extra').value)||0),fee=Number($('pricing-fee').value)||0,margin=Number($('pricing-margin').value)||0,units=Math.max(1,Math.floor(Number($('pricing-units').value)||1));
 const month=new Date().toISOString().slice(0,7);
 const fixedMonth=fixed().filter(x=>x.start<=month&&(!x.end||x.end>=month)).reduce((a,x)=>a+Math.max(0,Number(x.amount)||0),0);
 const share=fixedMonth/units,base=cost+extra+share,denom=1-(fee+margin)/100;
 if(fee<0||margin<0||fee+margin>=100){$('pricing-output').textContent='A soma das taxas e da margem deve ser menor que 100%.';return}
 const price=base/denom,net=price*(1-fee/100)-base;
 const selected=products().find(x=>String(x.id)===$('pricing-product').value);
 const current=selected?Number(selected.price)||0:0;
 $('pricing-output').innerHTML=`<strong>Preço sugerido: ${money(price)}</strong><br>Custo unitário total estimado: ${money(base)} (inclui ${money(share)} de rateio fixo)<br>Lucro estimado por unidade: ${money(net)}<br>Faturamento estimado com ${units} unidades: ${money(price*units)}<br>Lucro estimado no mês: ${money(net*units)}${selected?`<br>Preço cadastrado: ${money(current)} — diferença: ${money(price-current)}`:''}`;
}
function refresh(){const sel=$('pricing-product');if(!sel)return;const old=sel.value;sel.innerHTML='<option value="">Escolher perfume (opcional)</option>';products().sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR')).forEach(p=>{const opt=document.createElement('option');opt.value=p.id;opt.textContent=p.name;sel.append(opt)});sel.value=old;}
document.addEventListener('DOMContentLoaded',()=>{if(!$('pricing-output'))return;refresh();$('pricing-product').addEventListener('change',()=>{const p=products().find(x=>String(x.id)===$('pricing-product').value);if(p)$('pricing-cost').value=Number(p.cost)||0;update()});ids.forEach(id=>$(id).addEventListener('input',update));window.addEventListener('storage',()=>{refresh();update()});update();});
})();