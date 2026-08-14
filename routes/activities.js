const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

const ACTIVITIES = {
  arrange: {
    title: 'Arrange Sentence', reward: 0.10, dailyLimit: 10,
    questions: [
      ['school / I / every / go / day / to','I go to school every day.'],
      ['is / my / this / book','This is my book.'],
      ['playing / children / are / football','Children are playing football.'],
      ['she / English / speaks / well','She speaks English well.'],
      ['morning / I / tea / drink / every','I drink tea every morning.'],
      ['you / where / do / live','Where do you live?'],
      ['he / a / doctor / is','He is a doctor.'],
      ['likes / music / she','She likes music.'],
      ['today / is / Monday','Today is Monday.'],
      ['have / I / two / brothers','I have two brothers.'],
      ['can / swim / he','He can swim.'],
      ['market / went / we / to / the','We went to the market.'],
      ['your / what / name / is','What is your name?'],
      ['homework / finished / I / my','I finished my homework.'],
      ['very / this / easy / is','This is very easy.'],
      ['likes / Ravi / cricket','Ravi likes cricket.'],
      ['English / learning / am / I','I am learning English.'],
      ['door / please / close / the','Please close the door.'],
      ['happy / today / I / am','I am happy today.'],
      ['coffee / does / she / drink','Does she drink coffee?']
    ]
  },
  correction: {
    title: 'Fix the Sentence', reward: 0.15, dailyLimit: 10,
    questions: [
      ['He go to school every day.','He goes to school every day.'],
      ['She are my friend.','She is my friend.'],
      ['I has a car.','I have a car.'],
      ['They is playing cricket.','They are playing cricket.'],
      ['He do not like tea.','He does not like tea.'],
      ['She have two brothers.','She has two brothers.'],
      ['I am go to market.','I am going to the market.'],
      ['We was happy.','We were happy.'],
      ['He can sings well.','He can sing well.'],
      ['She don’t likes coffee.','She doesn’t like coffee.'],
      ['I seen him yesterday.','I saw him yesterday.'],
      ['There is many books.','There are many books.'],
      ['He is an honest man.','He is an honest man.'],
      ['I have went there.','I have gone there.'],
      ['She speak English very good.','She speaks English very well.'],
      ['Where you are going?','Where are you going?'],
      ['He have finished his work.','He has finished his work.'],
      ['My friends is here.','My friends are here.'],
      ['I did not went there.','I did not go there.'],
      ['She can to drive.','She can drive.']
    ]
  },
  translate: {
    title: 'Translate to English', reward: 0.15, dailyLimit: 10,
    questions: [
      ['હું દરરોજ અંગ્રેજી શીખું છું.','I learn English every day.'],
      ['મારું નામ રાહુલ છે.','My name is Rahul.'],
      ['તે શાળાએ જાય છે.','He goes to school.'],
      ['મને ચા ગમે છે.','I like tea.'],
      ['તમે ક્યાં રહો છો?','Where do you live?'],
      ['હું આજે વ્યસ્ત છું.','I am busy today.'],
      ['તે મારી બહેન છે.','She is my sister.'],
      ['મારે એક પુસ્તક છે.','I have a book.'],
      ['તમે શું કરી રહ્યા છો?','What are you doing?'],
      ['મને અંગ્રેજી બોલવું છે.','I want to speak English.'],
      ['તે ક્રિકેટ રમી રહ્યો છે.','He is playing cricket.'],
      ['હું સવારે વહેલો ઊઠું છું.','I wake up early in the morning.'],
      ['આ બહુ સરળ છે.','This is very easy.'],
      ['મને મદદ જોઈએ છે.','I need help.'],
      ['તેણી સારી રીતે ગાય છે.','She sings well.'],
      ['અમે બજારમાં ગયા હતા.','We went to the market.'],
      ['શું તમે અંગ્રેજી સમજો છો?','Do you understand English?'],
      ['હું મારા મિત્ર સાથે વાત કરું છું.','I talk to my friend.'],
      ['આ મારું ઘર છે.','This is my house.'],
      ['કાલે હું શાળાએ જઈશ.','I will go to school tomorrow.']
    ]
  },
  word: {
    title: 'Word Builder', reward: 0.05, dailyLimit: 15,
    questions: [
      ['lpepa','apple'],['raecahte','teacher'],['ohscool','school'],['fneird','friend'],['hpoen','phone'],
      ['mraekt','market'],['wtaer','water'],['flwoer','flower'],['famliy','family'],['cmoeputer','computer'],
      ['hppa y','happy'],['bueatiful','beautiful'],['morinng','morning'],['chlidren','children'],['kictchen','kitchen'],
      ['hosptial','hospital'],['langauge','language'],['qeuestion','question'],['answre','answer'],['strnog','strong']
    ]
  },
  fill: {
    title: 'Fill in the Blank', reward: 0.10, dailyLimit: 10,
    questions: [
      ['I ___ a student.',['am','is','are'],'am'],['She ___ to school every day.',['go','goes','going'],'goes'],
      ['They ___ happy.',['is','am','are'],'are'],['He ___ football yesterday.',['play','played','plays'],'played'],
      ['I ___ tea every morning.',['drink','drinks','drank'],'drink'],['We ___ learning English.',['is','are','am'],'are'],
      ['She ___ a new phone.',['have','has','having'],'has'],['You ___ very kind.',['is','are','am'],'are'],
      ['He ___ swim.',['can','cans','can to'],'can'],['I ___ my homework yesterday.',['finish','finished','finishes'],'finished'],
      ['There ___ two books.',['is','are','am'],'are'],['She ___ English well.',['speak','speaks','speaking'],'speaks'],
      ['I ___ going home.',['am','is','are'],'am'],['They ___ cricket now.',['play','are playing','played'],'are playing'],
      ['He ___ breakfast at 8.',['eat','eats','eating'],'eats']
    ]
  },
  listening: {
    title: 'Listen & Type', reward: 0.15, dailyLimit: 8,
    questions: [
      'I am learning English.','My name is Akash.','I go to school every day.','She is my best friend.',
      'What are you doing?','I like to read books.','Please open the door.','He is playing cricket.',
      'I drink water every morning.','We are going to the market.','English is an important language.',
      'I want to improve my speaking.','Today is a beautiful day.','Can you help me please?','I finished my homework.'
    ]
  },
  reading: {
    title: 'Reading Challenge', reward: 0.15, dailyLimit: 8,
    questions: [
      ['Riya wakes up at 6 o’clock every morning. She brushes her teeth and goes for a walk.','When does Riya wake up?',['At 6 o’clock','At 8 o’clock','At 10 o’clock'],'At 6 o’clock'],
      ['Amit likes reading books. He reads for thirty minutes every evening.','What does Amit like?',['Reading books','Playing football','Watching movies'],'Reading books'],
      ['John has a small dog named Bruno. Bruno likes to play in the garden.','What is the dog’s name?',['Bruno','John','Tom'],'Bruno'],
      ['Meena goes to the market on Sunday. She buys vegetables and fruit.','When does Meena go to the market?',['Sunday','Monday','Friday'],'Sunday'],
      ['Raj studies English every day because he wants to speak confidently.','Why does Raj study English?',['To speak confidently','To play games','To sleep'],'To speak confidently']
    ]
  },
  speaking: {
    title: 'Speak & Earn', reward: 0.20, dailyLimit: 5,
    questions: ['Introduce yourself in English.','Describe your daily routine.','Talk about your family.','What did you do yesterday?','What is your favorite hobby?','Describe your best friend.','Talk about your school or work.','What do you want to learn?']
  }
};

function todayKey(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
function normalize(s){return String(s||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();}
function fieldName(type){return `activity_${type}`;}
function publicQuestion(type,q){
  if(type==='arrange') return {prompt:q[0],answer:q[1]};
  if(type==='correction'||type==='translate') return {prompt:q[0],answer:q[1]};
  if(type==='word') return {prompt:q[0],answer:q[1]};
  if(type==='fill') return {prompt:q[0],options:q[1],answer:q[2]};
  if(type==='listening') return {prompt:q,answer:q};
  if(type==='reading') return {passage:q[0],prompt:q[1],options:q[2],answer:q[3]};
  return {prompt:q};
}

router.get('/:type', auth, async (req,res)=>{
  const type=req.params.type; const activity=ACTIVITIES[type];
  if(!activity) return res.status(404).json({success:false,message:'Activity not found'});
  const items=activity.questions.map((q,i)=>({id:i,...publicQuestion(type,q)}));
  res.json({success:true,type,title:activity.title,reward:activity.reward,dailyLimit:activity.dailyLimit,questions:items});
});

router.post('/:type/submit', auth, async (req,res)=>{
  try{
    const type=req.params.type; const activity=ACTIVITIES[type];
    if(!activity) return res.status(404).json({success:false,message:'Activity not found'});
    const index=Number(req.body.questionId); const answer=String(req.body.answer||'').trim();
    const q=activity.questions[index]; if(!q) return res.status(400).json({success:false,message:'Invalid question'});
    const expected= type==='fill'?q[2] : type==='reading'?q[3] : type==='listening'?q : type==='speaking'?null : q[1];
    let correct=false;
    if(type==='speaking') correct=normalize(answer).split(' ').filter(Boolean).length>=4;
    else correct=normalize(answer)===normalize(expected);
    const user=await User.findById(req.user.id); if(!user) return res.status(404).json({success:false,message:'User not found'});
    const today=todayKey();
    if(!user.activityDate || user.activityDate!==today){ user.activityDate=today; user.activityCounts={}; }
    if(!user.activityCounts) user.activityCounts={};
    const count=Number(user.activityCounts.get ? user.activityCounts.get(type)||0 : user.activityCounts[type]||0);
    if(count>=activity.dailyLimit) return res.status(400).json({success:false,message:`આજની ${activity.title} limit પૂર્ણ થઈ ગઈ છે.`,wallet:Number(user.wallet||0),totalEarn:Number(user.totalEarn||0),correct:false,limitReached:true});
    user.activityCounts.set ? user.activityCounts.set(type,count+1) : user.activityCounts[type]=count+1;
    if(correct){user.wallet=Number(user.wallet||0)+activity.reward;user.totalEarn=Number(user.totalEarn||0)+activity.reward;}
    await user.save();
    res.json({success:true,correct,reward:correct?activity.reward:0,wallet:Number(user.wallet||0),totalEarn:Number(user.totalEarn||0),used:count+1,remaining:Math.max(0,activity.dailyLimit-count-1),correctAnswer:expected});
  }catch(e){console.error(e);res.status(500).json({success:false,message:e.message});}
});
module.exports=router;
