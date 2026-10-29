'use strict';
const {strategies, questions} = window.learningContent;
const element = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
const cards = document.querySelector('#strategy-cards');
const tabs = document.querySelector('#lesson-tabs');
strategies.forEach((strategy, index) => {
  const card = element('article', undefined, `strategy-card ${strategy.color}`);
  const top = element('div', undefined, 'card-top'); top.append(element('span', strategy.icon, 'strategy-icon'), element('span', strategy.number, 'card-number'));
  card.append(top, element('h3', strategy.title), element('p', strategy.tagline, 'tagline'), element('p', strategy.description));
  const trigger = element('div', undefined, 'trigger'); trigger.append(element('span', 'JE GRIJPT IN OP BASIS VAN'), element('strong', strategy.trigger));
  const link = element('a', 'Ontdek deze strategie ↗', 'text-link'); link.href = '#verdieping'; link.addEventListener('click', () => selectLesson(index));
  card.append(trigger, link); cards.append(card);
  const tab = element('button', strategy.title); tab.type='button'; tab.role='tab'; tab.id=`tab-${strategy.id}`; tab.setAttribute('aria-controls','lesson-panel');
  tab.addEventListener('click', () => selectLesson(index));
  tab.addEventListener('keydown', event => { let next; if(event.key==='ArrowRight') next=(index+1)%strategies.length; if(event.key==='ArrowLeft') next=(index+strategies.length-1)%strategies.length; if(event.key==='Home') next=0; if(event.key==='End') next=strategies.length-1; if(next!==undefined){event.preventDefault(); selectLesson(next); tabs.children[next].focus();} }); tabs.append(tab);
});
function selectLesson(index) {
  [...tabs.children].forEach((tab, i) => {tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
  const strategy = strategies[index]; const panel=document.querySelector('#lesson-panel');panel.replaceChildren();panel.setAttribute('aria-labelledby',`tab-${strategy.id}`);
  const example=element('div',undefined,'lesson-example'); example.append(element('span','EEN VOORBEELD UIT DE PRAKTIJK','eyebrow'),element('h3',strategy.tagline),element('p',strategy.example));
  const explanation=element('div',undefined,'lesson-explanation');explanation.append(element('h4','Wat levert het op?'),element('p',strategy.benefits),element('h4','Waar let je op?'),element('p',strategy.limitations));
  panel.append(example,explanation,element('p',strategy.takeaway,'lesson-takeaway'));
}
selectLesson(0);
let questionIndex=0; let answers=[];
const quizCard=document.querySelector('#quiz-card');
function renderQuestion() {
  quizCard.replaceChildren();const done=questionIndex===questions.length;
  document.querySelector('#quiz-progress').textContent=done?'Kennischeck afgerond':`Vraag ${questionIndex+1} van ${questions.length}`;
  document.querySelector('#progress-bar').style.width=`${(questionIndex/questions.length)*100}%`;
  if(done){const score=answers.filter((answer,i)=>answer===questions[i].answer).length;quizCard.append(element('span','GOED DAT JE HEBT GEOEFEND','eyebrow'),element('h3',`${score} van de ${questions.length} goed.`),element('p','Je hebt alle situaties doorlopen. Bekijk de uitleg bij je antwoorden hieronder of oefen opnieuw.'));
    questions.forEach((q,i)=>{const review=element('details');review.append(element('summary',`${i+1}. ${answers[i]===q.answer?'Goed':'Nog eens bekijken'} — ${q.question}`),element('p',`Jouw antwoord: ${q.options[answers[i]]}. ${q.explanation}`));quizCard.append(review);});return;}
  const q=questions[questionIndex];quizCard.append(element('span',`SITUATIE ${String(questionIndex+1).padStart(2,'0')}`,'eyebrow'),element('h3',q.question));
  const options=element('div',undefined,'quiz-options');const feedback=element('div',undefined,'feedback');feedback.setAttribute('role','status');
  q.options.forEach((option,i)=>{const button=element('button');button.type='button';button.append(element('span',String.fromCharCode(65+i)),element('span',option));button.addEventListener('click',()=>{
    if(answers.length>questionIndex)return;answers.push(i);
    [...options.children].forEach((node,j)=>{node.disabled=true;if(j===q.answer)node.classList.add('correct');else if(j===i)node.classList.add('incorrect');});
    feedback.append(element('strong',i===q.answer?'Dat klopt.':'Een leermoment.'),element('p',q.explanation));
    const next=element('button',questionIndex===questions.length-1?'Bekijk je resultaat →':'Volgende situatie →','button');next.type='button';next.addEventListener('click',()=>{questionIndex++;renderQuestion();quizCard.querySelector('h3').tabIndex=-1;quizCard.querySelector('h3').focus();});feedback.append(next);
  });options.append(button);});quizCard.append(options,feedback);
}
document.querySelector('#restart').addEventListener('click',()=>{questionIndex=0;answers=[];renderQuestion();});renderQuestion();
