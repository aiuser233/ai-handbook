/* AI Handbook renderer. Markdown is canonical; annotations explain existing text. */
const ANNOS = [
  { section: 'sec-1-1', anchor: '稳定不等于正确', title: '稳定与准确分别验收', text: '低随机性只能帮助输出稳定；同一错误也能稳定重复。检查来源、公式与任务结果。' },
  { section: 'sec-1-2', anchor: '请输出 JSON，字段为', title: '结构与内容分开检查', text: '正文样例是合法 JSON。类型、缺失、百分比和来源有明确约定；字段完整不代表数据真实。' },
  { section: 'sec-1-10', anchor: '脚本运行成功不等于数字已验证', title: '独立复算关键样本', text: '程序能运行仍可能单位或公式错误；先确认原始材料和口径，再手算一份样本对照结果。' },
  { section: 'sec-6-4', anchor: '不阻止 AI 读取或上传', title: '忽略规则的范围', text: '.gitignore 管未跟踪文件，不是工具文件权限或网络控制，也不会清理已经提交的历史。' },
  { section: 'sec-8-2', anchor: '假设价格算例，不是当前厂商报价', title: '价格单位与费用分类', text: '正文按每百万 token 计价，明确缓存读取假设；算例未含首次写入、失效、工具和重试。当前报价应查对应供应商。' },
];
const PARTS = [
  { cls:'p1', ids:['ch1','ch2'] }, { cls:'p2', ids:['ch3','ch4','ch5'] },
  { cls:'p3', ids:['ch6','ch7'] }, { cls:'p5', ids:['ch8'] },
  { cls:'p4', ids:['ch9','ch10','appA','appB'] },
];
const EN = { ch0:'OVERVIEW & QUICK START',ch1:'CORE CONCEPTS',ch2:'PLATFORMS',ch3:'SAFETY & COMPLIANCE',
  ch4:'SKILLS',ch5:'SKILL IN PRACTICE',ch6:'GIT & GITHUB',ch7:'CLOUDFLARE',ch8:'COST & QUOTA',
  ch9:'FAQ & TROUBLESHOOTING',ch10:'GLOSSARY',appA:'PROMPT TEMPLATES',appB:'PRACTICE & ROADMAP' };

(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const root = document.documentElement;
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key,value) { try { localStorage.setItem(key,value); return true; } catch { return false; } },
  };
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const applyTheme = value => {
    const theme = value === 'dark' ? 'dark' : 'light';
    root.dataset.theme = theme;
    $('#themeBtn').textContent = theme === 'dark' ? '☀️' : '🌙';
    $('#themeBtn').setAttribute('aria-label', theme === 'dark' ? '切换浅色主题' : '切换深色主题');
  };
  applyTheme(store.get('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  $('#themeBtn').onclick = () => { applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'); store.set('theme', root.dataset.theme); };

  const side = $('#side'), navButton = $('#navBtn'), scrim = $('#scrim');
  const mobile = () => matchMedia('(max-width:1050px)').matches;
  const closeDrawer = (restore = false) => {
    const wasOpen = side.classList.contains('open');
    side.classList.remove('open'); document.body.classList.remove('nav-open');
    side.removeAttribute('role');side.removeAttribute('aria-modal');
    document.querySelector('.doc').inert=false;document.querySelector('.topbar').inert=!$('#gate').hidden;
    navButton.setAttribute('aria-expanded','false');
    if (mobile()) side.inert = true;
    if (restore && wasOpen) navButton.focus();
  };
  const openDrawer = () => {
    side.inert = false; side.classList.add('open'); document.body.classList.add('nav-open');
    side.setAttribute('role','dialog');side.setAttribute('aria-modal','true');side.setAttribute('aria-label','目录导航');
    document.querySelector('.doc').inert=true;document.querySelector('.topbar').inert=true;
    navButton.setAttribute('aria-expanded','true');
    (side.querySelector('a,button') || side).focus();
  };
  const updateLayout = () => {
    if (!mobile()) { closeDrawer(); side.inert = false; }
    else side.inert = !side.classList.contains('open');
  };
  navButton.onclick = () => side.classList.contains('open') ? closeDrawer(true) : openDrawer();
  scrim.onclick = () => closeDrawer(true);
  $('#closeNav').onclick = () => closeDrawer(true);
  addEventListener('resize', updateLayout, { passive:true });
  updateLayout();
  addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeDrawer(true); hideAnnotation(true); }
    if (event.key === 'Tab' && mobile() && side.classList.contains('open')) {
      const items = [...side.querySelectorAll('a,button')].filter(el => el.getClientRects().length);
      if (!items.length) return;
      const first=items[0],last=items[items.length-1];
      if (event.shiftKey && document.activeElement===first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement===last) { event.preventDefault(); first.focus(); }
    }
  });

  let cleanup = () => {}, loaded=false, loading=false, annotationTrigger=null, annotationTimer, restoringAnnotationFocus=false;
  const pop=$('#annoPop');
  function hideAnnotation(restore=false) {
    clearTimeout(annotationTimer); pop.hidden=true;
    if (annotationTrigger) {
      annotationTrigger.setAttribute('aria-expanded','false');
      if (restore) {
        restoringAnnotationFocus=true;
        try { annotationTrigger.focus(); } finally { restoringAnnotationFocus=false; }
      }
    }
    annotationTrigger=null;
  }
  $('#closeAnno').onclick=()=>hideAnnotation(true);
  pop.onmouseenter=()=>clearTimeout(annotationTimer);
  pop.onmouseleave=()=>{annotationTimer=setTimeout(()=>hideAnnotation(),180);};

  function assignIds(doc) {
    const ids=new Set(), headings=[...doc.querySelectorAll('h2,h3,h4')];
    for (const heading of headings) {
      const text=heading.textContent.trim(), id=HandbookHeadings.id(text,Number(heading.tagName.slice(1)));
      if (!id || ids.has(id)) throw new Error('重复或空标题锚点：'+text);
      ids.add(id); heading.id=id; heading.dataset.orig=text; heading.tabIndex=-1;
    }
    for (const id of ['ch0','ch1','ch2','ch3','ch4','ch5','ch6','ch7','ch8','ch9','ch10','appA','appB']) {
      if (!ids.has(id)) throw new Error('缺少章节：'+id);
    }
    const partOf=Object.fromEntries(PARTS.flatMap(part=>part.ids.map(id=>[id,part.cls])));
    let part='p0';
    headings.forEach(h=>{
      if(h.tagName==='H2') part=partOf[h.id]||'p0';
      h.dataset.part=part;
      if(EN[h.id]) { const en=document.createElement('span');en.className='h2-en';en.textContent=EN[h.id];h.append(en); }
    });
    return headings;
  }

  async function loadContent() {
    if(loading || loaded) return;
    loading=true; cleanup(); hideAnnotation();
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
    const disposers=[];
    const listen=(target,type,handler,options)=>{target.addEventListener(type,handler,options);disposers.push(()=>target.removeEventListener(type,handler,options));};
    cleanup=()=>disposers.splice(0).forEach(fn=>fn());
    const doc=$('#doc'), loadingEl=$('#loading'), err=$('#err');
    loadingEl.hidden=false;err.hidden=true;doc.hidden=true;doc.replaceChildren();$('#toc').replaceChildren();
    try {
      if(!window.marked || !window.DOMPurify || !window.HandbookHeadings) throw new Error('本地渲染依赖不可用，可先打开离线版或原始 Markdown');
      const res=await fetch('index.md',{cache:'no-store',signal:controller.signal});
      if(!res.ok) throw new Error('读取正文 HTTP '+res.status);
      const md=await res.text();
      doc.innerHTML=DOMPurify.sanitize(marked.parse(md,{gfm:true,breaks:false}),{USE_PROFILES:{html:true}});
      const headings=assignIds(doc),toc=$('#toc'),linkMap=new Map(),sections=[];
      let current=null;
      for(const heading of headings) {
        const link=document.createElement('a');link.href='#'+heading.id;link.textContent=heading.dataset.orig;
        linkMap.set(heading.id,link);
        if(heading.tagName==='H2') {
          const section=document.createElement('div');section.className='toc-sec';section.dataset.part=heading.dataset.part;
          const row=document.createElement('div');row.className='toc-heading-row';link.className='lv1';
          const toggle=document.createElement('button');toggle.className='toc-toggle';toggle.textContent='▸';toggle.setAttribute('aria-label','展开 '+heading.dataset.orig);
          const sub=document.createElement('div');sub.className='toc-sub';sub.id='toc-'+heading.id;
          toggle.setAttribute('aria-controls',sub.id);toggle.setAttribute('aria-expanded','false');
          const setOpen=open=>{section.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'▾':'▸';toggle.setAttribute('aria-label',(open?'收起 ':'展开 ')+heading.dataset.orig);};
          toggle.onclick=()=>{section.dataset.manual='true';setOpen(!section.classList.contains('open'));};
          row.append(link,toggle);section.append(row,sub);toc.append(section);
          current={section,sub,toggle,setOpen};sections.push(current);
        } else {
          link.className=heading.tagName==='H4'?'lv3':'lv2';
          (current?.sub||toc).append(link);
        }
      }
      sections.forEach(item=>{if(!item.sub.children.length){item.toggle.hidden=true;item.section.classList.add('empty');}});
      sections[0]?.setOpen(true);
      let lock=0,autoSection=sections[0];
      const activate=id=>{
        for(const link of linkMap.values()){link.classList.remove('active');link.removeAttribute('aria-current');}
        const link=linkMap.get(id);if(!link)return;
        link.classList.add('active');link.setAttribute('aria-current','location');
        const section=sections.find(s=>s.section.contains(link));
        if(section!==autoSection){
          if(autoSection&&autoSection.section.dataset.manual!=='true')autoSection.setOpen(false);
          section?.setOpen(true);autoSection=section;
        }
      };
      const jump=(id,replace=false)=>{
        const target=document.getElementById(id);if(!target)return false;
        activate(id);closeDrawer();lock=performance.now()+900;
        target.scrollIntoView({behavior:reduced()?'auto':'smooth',block:'start'});
        target.focus({preventScroll:true});
        if(!replace && location.hash!=='#'+id) history.pushState(null,'','#'+id);
        return true;
      };
      listen(document,'click',event=>{
        const link=event.target.closest('a[href^="#"]');if(!link||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
        const id=decodeURIComponent(link.getAttribute('href').slice(1));
        if(id==='top'){event.preventDefault();closeDrawer();window.scrollTo({top:0,behavior:reduced()?'auto':'smooth'});return;}
        if(jump(id))event.preventDefault();
      });
      const handleHash=()=>{let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}if(id)jump(id,true);};
      listen(window,'hashchange',handleHash);listen(window,'popstate',handleHash);
      let ticking=false;
      const onScroll=()=>{
        if(ticking)return;ticking=true;
        requestAnimationFrame(()=>{
          ticking=false;
          const html=document.documentElement,max=html.scrollHeight-html.clientHeight;
          $('#progress').style.width=(max>0?html.scrollTop/max*100:0)+'%';
          if(performance.now()<lock)return;
          let active=headings[0]?.id;
          for(const h of headings){if(h.getBoundingClientRect().top<=120)active=h.id;else break;}
          if(active)activate(active);
        });
      };
      listen(window,'scroll',onScroll,{passive:true});

      doc.querySelectorAll('table').forEach(table=>{
        const wrap=document.createElement('div');wrap.className='table-scroll';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','可横向滚动的数据表');
        table.before(wrap);wrap.append(table);
      });
      const firstTable=doc.querySelector('#ch0 ~ .table-scroll');
      if(firstTable){
        const cards=document.createElement('div');cards.className='toc-cards';
        firstTable.querySelectorAll('tbody tr').forEach(row=>{
          const cells=row.querySelectorAll('td');if(cells.length<3)return;
          const text=cells[0].textContent;const ch=text.match(/第\s*(\d+)\s*章/),app=text.match(/附录\s*([AB])/);
          const id=ch?'ch'+ch[1]:app?'app'+app[1]:null;if(!id)return;
          const card=document.createElement('a');card.className='toc-card';card.href='#'+id;card.dataset.part=document.getElementById(id).dataset.part;
          for(const [cls,cell]of [['no',cells[0]],['tt',cells[1]],['desc',cells[2]]]){const div=document.createElement('div');div.className=cls;div.textContent=cell.textContent;card.append(div);}cards.append(card);
        });firstTable.after(cards);if(cards.children.length)firstTable.hidden=true;
      }
      doc.querySelectorAll('pre').forEach(pre=>{
        const code=pre.querySelector('code');if(!code)return;
        const language=(code.className.match(/language-([\w+-]+)/)||[])[1];
        if(language==='text'||language==='markdown')pre.classList.add('prompt-code');
        const copy=document.createElement('button');copy.className='copybtn';copy.textContent='复制';copy.setAttribute('aria-label','复制完整代码或提示词');
        copy.onclick=async()=>{try{await navigator.clipboard.writeText(code.textContent);copy.textContent='已复制 ✓';$('#copyStatus').textContent='已复制完整内容。';}catch{copy.textContent='复制失败';$('#copyStatus').textContent='浏览器未允许复制，请选择正文手动复制。';}setTimeout(()=>copy.textContent='复制',1500);};pre.append(copy);
      });
      ANNOS.forEach((anno,index)=>{
        const start=document.getElementById(anno.section);if(!start)return;
        let el=start.nextElementSibling,found=null;
        while(el && !/^H[23]$/.test(el.tagName)&&!found){
          const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.nodeValue.includes(anno.anchor)&&!n.parentElement.closest('pre,script,.anno')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
          const node=walker.nextNode();if(node){const at=node.nodeValue.indexOf(anno.anchor),after=node.splitText(at);after.splitText(anno.anchor.length);found=document.createElement('button');found.type='button';found.className='anno';found.textContent=anno.anchor;found.dataset.annoI=index+1;found.setAttribute('aria-controls','annoPop');found.setAttribute('aria-expanded','false');found.setAttribute('aria-label',anno.anchor+'：查看说明');after.replaceWith(found);}
          el=el.nextElementSibling;
        }
        if(!found){console.warn('anno anchor not found',anno.section,anno.anchor);return;}
        const show=()=>{
          clearTimeout(annotationTimer);hideAnnotation();annotationTrigger=found;
          $('#annoTitle').textContent=anno.title;$('#annoBody').textContent=anno.text;pop.hidden=false;found.setAttribute('aria-expanded','true');
          const r=found.getBoundingClientRect(),width=pop.offsetWidth,height=pop.offsetHeight;
          pop.style.left=Math.max(8,Math.min(r.left,innerWidth-width-8))+'px';pop.style.top=Math.max(8,Math.min(r.bottom+8,innerHeight-height-8))+'px';
        };
        found.onmouseenter=show;found.onmouseleave=()=>{annotationTimer=setTimeout(()=>hideAnnotation(),180);};found.onfocus=()=>{if(!restoringAnnotationFocus)show();};
        found.onclick=()=>{if(annotationTrigger===found&&!pop.hidden){$('#closeAnno').focus();}else show();};
      });
      listen(document,'click',event=>{if(!pop.hidden&&!event.target.closest('.anno,#annoPop'))hideAnnotation();});
      listen(document,'focusin',event=>{if(!pop.hidden&&!event.target.closest('.anno,#annoPop'))hideAnnotation();});
      doc.hidden=false;loadingEl.hidden=true;loaded=true;
      requestAnimationFrame(()=>{handleHash();onScroll();});
    } catch(error) {
      cleanup();loadingEl.hidden=true;doc.hidden=true;err.hidden=false;
      $('#errorMessage').textContent='加载失败：'+(error.name==='AbortError'?'请求超时':error.message);
    } finally { clearTimeout(timer);loading=false; }
  }
  $('#retryBtn').onclick=()=>loadContent();

  // This invitation is a presentation preference. Public reading is always available.
  const INVITE_HASH='b97b94c8f7b033e6696a0ab00388f80b65891e16a4a4cf59d1c7ba4e72dff404';
  const INVITE_SALT='ai-handbook-2026',INVITE_KEY='invite-auth',TTL=86400000;
  const gate=$('#gate'),form=$('#inviteForm'),input=$('#inviteInput'),button=$('#inviteBtn');
  const background=[document.querySelector('.topbar'),document.querySelector('.layout')];
  const reveal=()=>{gate.hidden=true;background.forEach(el=>el.inert=false);$('#themeBtn').focus();updateLayout();loadContent();};
  $('#publicRead').onclick=reveal;
  let stored;try{stored=JSON.parse(store.get(INVITE_KEY)||'null');}catch{stored=null;}
  const valid=stored?.hash===INVITE_HASH&&Number.isFinite(stored.ts)&&Date.now()>=stored.ts&&Date.now()-stored.ts<TTL;
  form.onsubmit=async event=>{
    event.preventDefault();button.disabled=true;button.textContent='校验中…';$('#inviteErr').textContent='';
    try{
      if(!input.value)throw new Error('请输入邀请码，或直接公开阅读');
      if(!crypto.subtle)throw new Error('当前环境不支持校验，可直接公开阅读');
      const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input.value+INVITE_SALT));
      const hash=[...new Uint8Array(buf)].map(n=>n.toString(16).padStart(2,'0')).join('');
      if(hash!==INVITE_HASH)throw new Error('邀请码不正确；公开阅读不需要邀请码');
      store.set(INVITE_KEY,JSON.stringify({hash,ts:Date.now()}));reveal();
    }catch(error){$('#inviteErr').textContent=error.message;input.focus();}
    finally{button.disabled=false;button.textContent='进入';}
  };
  gate.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const items=[...gate.querySelectorAll('input,button')].filter(el=>!el.disabled);
    const first=items[0],last=items[items.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  if(valid)reveal();else{gate.hidden=false;background.forEach(el=>el.inert=true);input.focus();}
})();
