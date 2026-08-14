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
    ['coffee / does / she / drink','Does she drink coffee?'],
    ['every / walks / morning / he','He walks every morning.'],
    ['is / my / teacher / she','She is my teacher.'],
    ['football / they / play / every / Sunday','They play football every Sunday.'],
    ['a / new / car / has / he','He has a new car.'],
    ['like / I / mangoes','I like mangoes.'],
    ['time / what / is / it','What time is it?'],
    ['my / this / house / is','This is my house.'],
    ['school / to / goes / she / daily','She goes to school daily.'],
    ['reading / book / a / he / is','He is reading a book.'],
    ['are / where / my / shoes','Where are my shoes?'],
    ['name / her / is / Priya','Her name is Priya.'],
    ['very / today / busy / am / I','I am very busy today.'],
    ['the / open / window / please','Please open the window.'],
    ['food / likes / Indian / he','He likes Indian food.'],
    ['playing / garden / children / are / in / the','Children are playing in the garden.'],
    ['English / speak / can / you','Can you speak English?'],
    ['father / my / is / a / teacher','My father is a teacher.'],
    ['at / gets / up / six / he','He gets up at six.'],
    ['milk / every / drinks / morning / she','She drinks milk every morning.'],
    ['yesterday / I / him / met','I met him yesterday.'],
    ['to / want / I / learn / English','I want to learn English.'],
    ['beautiful / is / this / flower','This flower is beautiful.'],
    ['friends / are / my / here','My friends are here.'],
    ['watch / I / TV / evening / every','I watch TV every evening.'],
    ['does / where / work / he','Where does he work?'],
    ['a / dog / has / she','She has a dog.'],
    ['today / raining / is / it','It is raining today.'],
    ['book / this / interesting / is','This book is interesting.'],
    ['school / walks / to / he','He walks to school.'],
    ['help / need / I / your','I need your help.'],
    ['mother / my / cooking / is','My mother is cooking.'],
    ['football / watching / they / are','They are watching football.'],
    ['every / exercise / day / I','I exercise every day.'],
    ['does / she / English / speak','Does she speak English?'],
    ['room / clean / my / is','My room is clean.'],
    ['new / phone / bought / I / a','I bought a new phone.'],
    ['Sunday / on / visit / we / grandmother / our','We visit our grandmother on Sunday.'],
    ['very / he / is / intelligent','He is very intelligent.'],
    ['morning / newspaper / reads / father / my / the','My father reads the newspaper in the morning.'],
    ['to / going / are / we / market / the','We are going to the market.'],
    ['favorite / what / your / is / color','What is your favorite color?'],
    ['blue / favorite / my / is / color','My favorite color is blue.'],
    ['home / came / late / he','He came home late.'],
    ['beautiful / has / she / a / dress','She has a beautiful dress.'],
    ['water / drink / please / some','Please drink some water.'],
    ['English / every / practice / I / day','I practice English every day.'],
    ['brother / my / cricket / plays','My brother plays cricket.'],
    ['is / where / station / the','Where is the station?'],
    ['bus / by / school / go / I / to','I go to school by bus.'],
    ['dinner / cooking / mother / is / my','My mother is cooking dinner.'],
    ['yesterday / went / cinema / we / to / the','We went to the cinema yesterday.'],
    ['morning / beautiful / is / the','The morning is beautiful.'],
    ['does / what / your / father / do','What does your father do?'],
    ['doctor / my / father / is / a','My father is a doctor.'],
    ['very / likes / she / flowers / much','She likes flowers very much.'],
    ['computer / using / am / I / a','I am using a computer.'],
    ['homework / doing / he / is / his','He is doing his homework.'],
    ['friends / with / playing / I / am / my','I am playing with my friends.'],
    ['school / starts / at / eight','School starts at eight.'],
    ['lunch / having / they / are','They are having lunch.'],
    ['name / what / is / your','What is your name?'],
    ['from / I / India / am','I am from India.'],
    ['English / learn / want / I / to','I want to learn English.'],
    ['very / my / family / is / big','My family is very big.'],
    ['sister / my / doctor / is / a','My sister is a doctor.'],
    ['morning / walks / she / every','She walks every morning.'],
    ['cricket / likes / playing / Rahul','Rahul likes playing cricket.'],
    ['you / are / how','How are you?'],
    ['fine / I / am / thank / you','I am fine, thank you.'],
    ['tomorrow / school / go / will / I / to','I will go to school tomorrow.'],
    ['today / weather / the / nice / is','The weather is nice today.'],
    ['friend / my / very / is / helpful','My friend is very helpful.'],
    ['read / books / I / every / week','I read books every week.'],
    ['morning / breakfast / eats / he / every','He eats breakfast every morning.'],
    ['home / she / at / is','She is at home.'],
    ['playing / boys / cricket / are','Boys are playing cricket.'],
    ['water / bottle / my / is / this','This is my water bottle.'],
    ['open / door / the / can / you','Can you open the door?'],
    ['English / very / speaks / she / well','She speaks English very well.'],
    ['happy / makes / music / me','Music makes me happy.']
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
    ['She can to drive.','She can drive.'],
    ['He play football every Sunday.','He plays football every Sunday.'],
    ['She go to work by bus.','She goes to work by bus.'],
    ['I am a student of English.','I am an English student.'],
    ['They was at home yesterday.','They were at home yesterday.'],
    ['We has a new teacher.','We have a new teacher.'],
    ['My brother like cricket.','My brother likes cricket.'],
    ['The children is playing outside.','The children are playing outside.'],
    ['He don’t know the answer.','He doesn’t know the answer.'],
    ['She do her homework every day.','She does her homework every day.'],
    ['I goes to school daily.','I go to school daily.'],
    ['He have a new phone.','He has a new phone.'],
    ['She are cooking dinner.','She is cooking dinner.'],
    ['We is ready now.','We are ready now.'],
    ['They has two cars.','They have two cars.'],
    ['I does my work every day.','I do my work every day.'],
    ['You is very kind.','You are very kind.'],
    ['It are raining today.','It is raining today.'],
    ['He were sick yesterday.','He was sick yesterday.'],
    ['She were happy yesterday.','She was happy yesterday.'],
    ['I were busy yesterday.','I was busy yesterday.'],
    ['He can speaks English.','He can speak English.'],
    ['She can sings very well.','She can sing very well.'],
    ['They can to swim.','They can swim.'],
    ['I can to help you.','I can help you.'],
    ['He must to go now.','He must go now.'],
    ['You should to study more.','You should study more.'],
    ['She will goes tomorrow.','She will go tomorrow.'],
    ['I will to call you later.','I will call you later.'],
    ['They will comes soon.','They will come soon.'],
    ['He may goes there.','He may go there.'],
    ['I am learning English every day.','I learn English every day.'],
    ['She is go to school now.','She is going to school now.'],
    ['They are play cricket now.','They are playing cricket now.'],
    ['He is reading a book.','He is reading a book.'],
    ['We are learn English.','We are learning English.'],
    ['I am write a letter.','I am writing a letter.'],
    ['She is cook dinner.','She is cooking dinner.'],
    ['He is watch TV.','He is watching TV.'],
    ['They are study English.','They are studying English.'],
    ['You are speak too fast.','You are speaking too fast.'],
    ['I have see this movie.','I have seen this movie.'],
    ['She has finish her work.','She has finished her work.'],
    ['They have went home.','They have gone home.'],
    ['He has eat breakfast.','He has eaten breakfast.'],
    ['We have saw him before.','We have seen him before.'],
    ['I have complete my homework.','I have completed my homework.'],
    ['She has write a letter.','She has written a letter.'],
    ['He has take my book.','He has taken my book.'],
    ['They have buy a new car.','They have bought a new car.'],
    ['We have make a mistake.','We have made a mistake.'],
    ['I did not saw him.','I did not see him.'],
    ['She did not went to school.','She did not go to school.'],
    ['He did not ate breakfast.','He did not eat breakfast.'],
    ['They did not played cricket.','They did not play cricket.'],
    ['We did not watched the movie.','We did not watch the movie.'],
    ['I did not knew the answer.','I did not know the answer.'],
    ['She did not came yesterday.','She did not come yesterday.'],
    ['He did not finished his work.','He did not finish his work.'],
    ['They did not bought anything.','They did not buy anything.'],
    ['I did not understood the question.','I did not understand the question.'],
    ['Where you live?','Where do you live?'],
    ['What you are doing?','What are you doing?'],
    ['Where he works?','Where does he work?'],
    ['What she likes?','What does she like?'],
    ['Why you are late?','Why are you late?'],
    ['When he will come?','When will he come?'],
    ['Where they went yesterday?','Where did they go yesterday?'],
    ['What does he wants?','What does he want?'],
    ['Why she is crying?','Why is she crying?'],
    ['How you are feeling?','How are you feeling?'],
    ['She don’t like tea.','She doesn’t like tea.'],
    ['He don’t play cricket.','He doesn’t play cricket.'],
    ['I doesn’t understand.','I don’t understand.'],
    ['They doesn’t work here.','They don’t work here.'],
    ['We doesn’t have money.','We don’t have money.'],
    ['He don’t goes to school.','He doesn’t go to school.'],
    ['She don’t speaks English.','She doesn’t speak English.'],
    ['I don’t likes coffee.','I don’t like coffee.'],
    ['They don’t plays football.','They don’t play football.'],
    ['He doesn’t knows me.','He doesn’t know me.'],
    ['There is two students in the class.','There are two students in the class.'],
    ['There are a book on the table.','There is a book on the table.'],
    ['There is many people here.','There are many people here.'],
    ['There are one apple in the basket.','There is one apple in the basket.'],
    ['There is five chairs in the room.','There are five chairs in the room.'],
    ['There are a dog outside.','There is a dog outside.'],
    ['There is some books on the desk.','There are some books on the desk.'],
    ['There are an orange on the table.','There is an orange on the table.'],
    ['There is three cars outside.','There are three cars outside.'],
    ['There are one student in the room.','There is one student in the room.']

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
    if(correct){
      user.wallet=Number(user.wallet||0)+activity.reward;
      user.totalEarn=Number(user.totalEarn||0)+activity.reward;
    }else{
      user.wallet=Math.max(0, Number(user.wallet||0)-activity.reward);
    }
    await user.save();
    res.json({
      success:true,
      correct,
      reward:correct?activity.reward:-activity.reward,
      wallet:Number(user.wallet||0),
      totalEarn:Number(user.totalEarn||0),
      used:count+1,
      remaining:Math.max(0,activity.dailyLimit-count-1),
      correctAnswer:expected
    });
  }catch(e){console.error(e);res.status(500).json({success:false,message:e.message});}
});
module.exports=router;
