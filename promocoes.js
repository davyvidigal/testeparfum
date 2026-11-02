// GERADOR DE PROMOÇÕES - PARFUM VIDIGAL
// Arte local em Canvas. Para geração por IA, integrar um endpoint seguro no servidor.
(function initPromotionStudio() {
  const host = document.getElementById('admin-main');
  if (!host) return;
  const section = document.createElement('section');
  section.id = 'promotion-studio';
  section.style.cssText = 'margin:24px 0;padding:20px;border:1px solid currentColor;border-radius:10px';
  section.innerHTML = `
    <h2>Gerador de promoções • Parfum Vidigal</h2>
    <p>Crie uma arte para o grupo de vendas do WhatsApp usando a foto real do perfume e a logo oficial da loja.</p>
    <label>Logo da loja (opcional: substituir a logo padrão) <input id="promo-logo" type="file" accept="image/png,image/jpeg,image/webp" style="display:block;width:100%"></label>
    <form id="promotion-form" style="display:grid;gap:12px">
      <label>Perfume cadastrado <select id="promo-product" style="width:100%;padding:10px"></select></label>
      <label>Ou envie uma nova foto <input id="promo-photo" type="file" accept="image/png,image/jpeg,image/webp" style="display:block;width:100%"></label>
      <label>Preço original (R$) <input id="promo-original" type="number" min="0" step="0.01" required style="display:block;width:100%;padding:10px"></label>
      <label>Preço promocional (R$) <input id="promo-price" type="number" min="0.01" step="0.01" required style="display:block;width:100%;padding:10px"></label>
      <label>Frase da promoção <input id="promo-caption" maxlength="75" value="Oferta especial por tempo limitado!" style="display:block;width:100%;padding:10px"></label>
      <label style="display:flex;align-items:center;gap:8px"><input id="promo-remove-white" type="checkbox" checked style="width:auto"> Remover fundo branco da foto do perfume</label>
      <label>Estilo <select id="promo-style" style="display:block;width:100%;padding:10px"><option value="luxo">Luxo • preto e dourado</option><option value="oferta">Oferta • vermelho e dourado</option></select></label>
      <button type="submit" >GERAR ARTE</button>
    </form>
    <p id="promo-status" role="status"></p>
    <canvas id="promo-canvas" width="1080" height="1350" style="display:none;width:100%;max-width:420px;border-radius:12px;margin:14px 0"></canvas>
    <div id="promo-actions" style="display:none;gap:10px;flex-wrap:wrap">
      <button id="promo-download" type="button">BAIXAR IMAGEM</button>
      <button id="promo-share" type="button">COMPARTILHAR</button>
      <button id="promo-message" type="button">COPIAR MENSAGEM</button>
      <button id="promo-whatsapp" type="button">ABRIR WHATSAPP</button>
    </div>
    <small>Esta versão cria artes localmente, sem custo de API. A geração de imagens por IA requer integração com servidor.</small>`;
  host.appendChild(section);
  const $ = id => section.querySelector('#' + id);
  const canvas = $('promo-canvas');
  const ctx = canvas.getContext('2d');
  // Desenha um retângulo arredondado compatível com navegadores antigos.
  function roundRect(x, y, width, height, radius) {
    const r = Math.max(0, Math.min(radius, width / 2, height / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  const status = $('promo-status');
  let imageBlob = null;
  let message = '';
  const currency = value => Number(value).toLocaleString('pt-BR', {style:'currency',currency:'BRL'});
  const products = () => typeof getProductsAlphabetically === 'function' ? getProductsAlphabetically() : [];
  function refresh() {
    const selected = $('promo-product').value;
    $('promo-product').replaceChildren();
    const opt = new Option('Selecione um perfume', '');
    $('promo-product').add(opt);
    products().forEach(p => $('promo-product').add(new Option(p.name, String(p.id))));
    $('promo-product').value = selected;
  }
  $('promo-product').addEventListener('change', () => {
    const p = products().find(p => String(p.id) === $('promo-product').value);
    if (p) $('promo-original').value = Number(p.price).toFixed(2);
  });
  refresh();
  // Atualizar opções após salvar/excluir sem alterar as funções existentes.
  document.addEventListener('click', e => {
    if (e.target.closest('#save-button, .delete-button')) setTimeout(refresh, 100);
  });
  function loadImage(src) {
    return new Promise((resolve,reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Não foi possível carregar a foto. Envie um arquivo do dispositivo.'));
      if (/^https?:/i.test(src)) img.crossOrigin = 'anonymous';
      img.src = src;
    });
  }
  // Testa CORS em um canvas DESCARTÁVEL antes de desenhar no canvas final.
  // Uma imagem remota pode carregar visualmente, mas contaminar o canvas.
  function canExportImage(img) {
    const probe = document.createElement('canvas');
    probe.width = 2; probe.height = 2;
    try {
      const probeCtx = probe.getContext('2d', { willReadFrequently: true });
      probeCtx.drawImage(img, 0, 0, 2, 2);
      probeCtx.getImageData(0, 0, 1, 1);
      return true;
    } catch (error) {
      if (error.name === 'SecurityError') return false;
      throw error;
    }
  }
  // Remove apenas regiões quase brancas conectadas às bordas da foto.
  // Isso evita apagar áreas claras internas do frasco ou do rótulo.
  function removeWhiteBackground(img) {
    const maxSide = 1400;
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const temp = document.createElement('canvas');
    temp.width = w; temp.height = h;
    const t = temp.getContext('2d', {willReadFrequently:true});
    t.drawImage(img,0,0,w,h);
    const frame = t.getImageData(0,0,w,h);
    const d = frame.data, count = w*h;
    const seen = new Uint8Array(count);
    const queue = new Int32Array(count);
    let head=0, tail=0;
    function isBackground(i) {
      const k=i*4, r=d[k],g=d[k+1],b=d[k+2];
      return d[k+3]<15 || (Math.min(r,g,b)>225 && Math.max(r,g,b)-Math.min(r,g,b)<28);
    }
    function add(i) {if(!seen[i] && isBackground(i)){seen[i]=1;queue[tail++]=i;}}
    for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}
    for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
    // Fotos sem fundo branco ficam intocadas.
    if(tail===0)return img;
    while(head<tail){
      const i=queue[head++],x=i%w,y=(i/w)|0;
      if(x>0)add(i-1);if(x<w-1)add(i+1);
      if(y>0)add(i-w);if(y<h-1)add(i+w);
    }
    for(let i=0;i<count;i++)if(seen[i])d[i*4+3]=0;
    t.putImageData(frame,0,0);
    return temp;
  }
  function wrapText(text, maxWidth, maxLines) {
    const words = text.split(/\s+/); const lines = []; let line = '';
    for (const word of words) {
      const next = line ? line + ' ' + word : word;
      if (ctx.measureText(next).width > maxWidth && line) {lines.push(line);line = word;} else line = next;
    }
    if (line) lines.push(line);
    return lines.slice(0,maxLines);
  }
  $('promotion-form').addEventListener('submit', async e => {
    e.preventDefault();
    if (typeof isAuthenticated === 'function' && !isAuthenticated()) return;
    const p = products().find(p => String(p.id) === $('promo-product').value);
    const file = $('promo-photo').files[0];
    if (!file && !p) {status.textContent='Selecione um perfume ou envie uma foto.';return;}
    if (file && (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5*1024*1024)) {status.textContent='Envie JPG, PNG ou WEBP de até 5 MB.';return;}
    const original = Number($('promo-original').value), price = Number($('promo-price').value);
    if (!(original > price && price > 0)) {status.textContent='O preço promocional deve ser menor que o original.';return;}
    status.textContent='Preparando arte...';
    imageBlob = null;
    canvas.style.display = 'none';
    $('promo-actions').style.display = 'none';
    let objectURL, logoURL;
    try {
      const source = file ? (objectURL=URL.createObjectURL(file)) : p.image;
      let img;
      try { img = await loadImage(source); }
      catch (imageError) {
        if (!file && p && /^https?:/i.test(p.image || ''))
          throw new Error('A foto deste produto vem de outro site e bloqueou o carregamento. Use o campo «Ou envie uma nova foto» para selecionar uma imagem salva no seu dispositivo.');
        throw imageError;
      }
      if (!canExportImage(img)) {
        throw new Error('A foto deste perfume é de um site externo que não permite exportar imagens (CORS). Escolha uma foto salva no computador no campo «Ou envie uma nova foto». Isso resolve o erro sem mudar o visual da arte.');
      }
      const logoFile = $('promo-logo').files[0];
      if (logoFile && (!['image/jpeg','image/png','image/webp'].includes(logoFile.type) || logoFile.size > 5*1024*1024)) throw new Error('A logo deve ser JPG, PNG ou WEBP de até 5 MB.');
      const logoSource = logoFile ? (logoURL=URL.createObjectURL(logoFile)) : 'logo-parfum-vidigal.jpg';
      let logo = null;
      try {
        logo = await loadImage(logoSource);
        if (!canExportImage(logo)) {
          console.warn('Logo sem permissão de exportação; será usado o nome da loja.');
          logo = null;
        }
      }
      catch (logoError) {
        console.warn('Logo não carregada; a arte será gerada sem bloquear:', logoError);
      }
      const red = $('promo-style').value === 'oferta';
      const W=1080,H=1350;
      const gold='#DAB177', muted='#B99A76';
      const bg=ctx.createLinearGradient(0,0,W,H);
      bg.addColorStop(0,red?'#38201D':'#241A16');
      bg.addColorStop(.52,red?'#1A1010':'#0E0B0A');
      bg.addColorStop(1,red?'#321B1B':'#1D1511');
      ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
      // Iluminação difusa de estúdio, sem alterar a foto do perfume.
      const halo=ctx.createRadialGradient(540,560,20,540,560,650);
      halo.addColorStop(0,red?'rgba(239,113,105,.24)':'rgba(224,183,113,.24)');
      halo.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=halo;ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='rgba(231,200,139,.48)';ctx.lineWidth=2;
      ctx.strokeRect(35,35,1010,1280);
      ctx.strokeStyle='rgba(231,200,139,.20)';ctx.strokeRect(46,46,988,1258);
      ctx.textAlign='center';ctx.textBaseline='middle';
      if (logo) {
      // Logo original integrada à composição, com moldura e brilho dourado.
      // A foto original da logo não é alterada nem redesenhada.
      ctx.save();
      const lx=420,ly=56,ls=240;
      const logoGlow=ctx.createRadialGradient(540,170,25,540,170,200);
      logoGlow.addColorStop(0,'rgba(218,177,119,.15)');logoGlow.addColorStop(1,'rgba(218,177,119,0)');
      ctx.fillStyle=logoGlow;ctx.fillRect(330,0,420,340);
      ctx.shadowColor='rgba(218,177,119,.28)';ctx.shadowBlur=22;
      ctx.strokeStyle='rgba(218,177,119,.5)';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(540,176,132,0,Math.PI*2);ctx.stroke();
      ctx.shadowBlur=0;
      ctx.beginPath();ctx.arc(540,176,120,0,Math.PI*2);ctx.clip();
      const logoScale=Math.max(ls/logo.width,ls/logo.height);
      const lw=logo.width*logoScale,lh=logo.height*logoScale;
      ctx.drawImage(logo,lx+(ls-lw)/2,ly+(ls-lh)/2,lw,lh);
      ctx.restore();
      } else {
        ctx.fillStyle = gold; ctx.font = "bold 44px Georgia, serif";
        ctx.fillText("PARFUM VIDIGAL", 540, 173);
      }
      ctx.fillStyle='#F7F0E4';ctx.font='bold 62px Arial, sans-serif';
      ctx.fillText('OFERTA ESPECIAL',540,352);
      // Separador fino abaixo do título, sem encostar na logo.
      ctx.strokeStyle='rgba(218,177,119,.65)';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(320,400);ctx.lineTo(505,400);ctx.moveTo(575,400);ctx.lineTo(760,400);ctx.stroke();
      // Foto central com margem discreta, proporcional à própria foto.
      // Sem a antiga caixa dourada larga e vazia.
      const productImage=$('promo-remove-white').checked ? removeWhiteBackground(img) : img;
      const maxPhotoW=650,maxPhotoH=475;
      const scale=Math.min(maxPhotoW/productImage.width,maxPhotoH/productImage.height);
      const w=productImage.width*scale,h=productImage.height*scale;
      const photoX=540-w/2,photoY=660-h/2;
      const margin=9;
      const frameX=photoX-margin,frameY=photoY-margin;
      const frameW=w+margin*2,frameH=h+margin*2;
      ctx.save();
      roundRect(frameX,frameY,frameW,frameH,14);ctx.clip();
      const panel=ctx.createRadialGradient(540,660,20,540,660,390);
      panel.addColorStop(0,red?'rgba(122,55,48,.20)':'rgba(158,105,58,.18)');
      panel.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=panel;ctx.fillRect(frameX,frameY,frameW,frameH);
      ctx.shadowColor='rgba(0,0,0,.4)';ctx.shadowBlur=18;ctx.shadowOffsetY=8;
      ctx.drawImage(productImage,photoX,photoY,w,h);
      ctx.restore();
      // Linha sutil, quase rente à imagem (não é uma moldura externa grande).
      ctx.strokeStyle='rgba(218,177,119,.38)';ctx.lineWidth=1.5;
      roundRect(frameX,frameY,frameW,frameH,14);ctx.stroke();
      const name=p?.name || 'PERFUME EM PROMOÇÃO';
      function fitted(text,maxWidth,startSize,minSize,weight='bold') {
        let size=startSize;
        do {ctx.font=weight+' '+size+'px Arial, sans-serif';if(ctx.measureText(text).width<=maxWidth)break;size-=2;}while(size>minSize);
        return size;
      }
      const lines=wrapText(name.toUpperCase(),920,2);
      ctx.fillStyle='#F8F5EE';
      lines.forEach((line,i)=>{fitted(line,920,49,29);ctx.fillText(line,540,954+i*51);});
      const discount=Math.round((1-price/original)*100);
      ctx.save();ctx.fillStyle=red?'#A62D37':'#9D793D';
      roundRect(425,lines.length>1?1060:1022,230,48,22);ctx.fill();
      ctx.fillStyle='#FFF';ctx.font='bold 26px Arial';
      ctx.fillText(discount+'% OFF',540,lines.length>1?1084:1046);ctx.restore();
      const priceTop=lines.length>1?1142:1108;
      ctx.fillStyle='#BFB8AD';ctx.font='31px Arial';
      const oldText='DE '+currency(original);
      ctx.fillText(oldText,540,priceTop);
      const oldW=ctx.measureText(oldText).width;
      ctx.strokeStyle='#D3A5A0';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(540-oldW/2,priceTop);ctx.lineTo(540+oldW/2,priceTop);ctx.stroke();
      ctx.fillStyle=gold;
      fitted('POR '+currency(price),880,82,52);
      ctx.fillText('POR '+currency(price),540,priceTop+82);
      const caption=($('promo-caption').value||'Aproveite esta oportunidade!').trim();
      ctx.fillStyle='#E8E0D5';fitted(caption,900,27,17,'normal');
      ctx.fillText(caption,540,1282);
      try { imageBlob=await new Promise((resolve, reject) => {
        try { canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Não foi possível exportar a imagem.')), 'image/png'); }
        catch (e) { reject(e); }
      }); } catch (exportError) {
        if (!file && p && /^https?:/i.test(p.image || ''))
          throw new Error('O servidor da foto do perfume impede exportar a arte (CORS). Selecione uma foto do seu dispositivo em «Ou envie uma nova foto» e tente novamente.');
        throw new Error('Erro ao exportar a arte: ' + exportError.message);
      }
      if (!imageBlob) throw new Error('Falha ao exportar a imagem.');

      message=`✨ *PROMOÇÃO PARFUM VIDIGAL* ✨\n\n🌟 ${name}\nDe: ~${currency(original)}~\n🔥 Por: *${currency(price)}* (${discount}% OFF)\n\n${$('promo-caption').value}\n\nChame para garantir o seu!`;
      canvas.style.display='block';$('promo-actions').style.display='flex';status.textContent='Arte pronta para baixar ou compartilhar!';
    } catch(err) {status.textContent=err.message;console.error('Erro ao gerar promoção:',err);}
    finally {if(objectURL) URL.revokeObjectURL(objectURL);if(logoURL) URL.revokeObjectURL(logoURL);}
  });
  $('promo-download').onclick=()=>{
    if(!imageBlob)return;
    const url=URL.createObjectURL(imageBlob),a=document.createElement('a');a.href=url;a.download='promocao-parfum-vidigal.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
  };
  $('promo-message').onclick=async()=>{try{await navigator.clipboard.writeText(message);status.textContent='Mensagem copiada!';}catch{status.textContent='Não foi possível copiar. Use HTTPS ou localhost.';}};
  $('promo-whatsapp').onclick=()=>window.open('https://api.whatsapp.com/send?text='+encodeURIComponent(message),'_blank','noopener,noreferrer');
  $('promo-share').onclick=async()=>{
    if(!imageBlob)return;
    const file=new File([imageBlob],'promocao-parfum-vidigal.png',{type:'image/png'});
    try {
      if(navigator.canShare?.({files:[file]})) await navigator.share({files:[file],text:message});
      else {status.textContent='Compartilhamento de imagem indisponível neste navegador. Baixe a arte e envie no grupo manualmente.';}
    } catch(err) {if(err.name!=='AbortError')status.textContent='Falha ao compartilhar: '+err.message;}
  };
})();
