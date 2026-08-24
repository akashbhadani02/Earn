const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

const ACTIVITIES = {
  arrange: {
    title: 'Arrange Sentence', reward: 0.10, dailyLimit: 70,
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
    title: 'Fix the Sentence', reward: 0.15, dailyLimit: 70,
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
    title: 'Translate to English', reward: 0.15, dailyLimit: 70,
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
    ['કાલે હું શાળાએ જઈશ.','I will go to school tomorrow.'],
    ['મારા પિતા શિક્ષક છે.','My father is a teacher.'],
    ['મારી માતા રસોઈ બનાવે છે.','My mother cooks food.'],
    ['મને ક્રિકેટ રમવું ગમે છે.','I like playing cricket.'],
    ['તે દરરોજ દોડે છે.','He runs every day.'],
    ['તે સુંદર ગીત ગાય છે.','She sings a beautiful song.'],
    ['અમે દર રવિવારે બજારમાં જઈએ છીએ.','We go to the market every Sunday.'],
    ['મારો ભાઈ એક વિદ્યાર્થી છે.','My brother is a student.'],
    ['મારી બહેન અંગ્રેજી શીખે છે.','My sister learns English.'],
    ['તમે ખૂબ સરસ બોલો છો.','You speak very well.'],
    ['મને પાણી જોઈએ છે.','I need water.'],
    ['હું અત્યારે પુસ્તક વાંચી રહ્યો છું.','I am reading a book now.'],
    ['તે ટીવી જોઈ રહી છે.','She is watching TV.'],
    ['બાળકો મેદાનમાં રમી રહ્યા છે.','The children are playing in the ground.'],
    ['અમે અંગ્રેજી શીખી રહ્યા છીએ.','We are learning English.'],
    ['તે અત્યારે કામ કરી રહ્યો છે.','He is working now.'],
    ['તમે ક્યાં જઈ રહ્યા છો?','Where are you going?'],
    ['હું ઘરે જઈ રહ્યો છું.','I am going home.'],
    ['તે રસોઈ બનાવી રહી છે.','She is cooking.'],
    ['તેઓ ક્રિકેટ રમી રહ્યા છે.','They are playing cricket.'],
    ['હું મારા મિત્રની રાહ જોઈ રહ્યો છું.','I am waiting for my friend.'],
    ['ગઈકાલે હું શાળાએ ગયો હતો.','I went to school yesterday.'],
    ['તેણે મને ફોન કર્યો હતો.','He called me.'],
    ['અમે ગઈકાલે ફિલ્મ જોઈ હતી.','We watched a movie yesterday.'],
    ['તેણીએ પોતાનું કામ પૂરું કર્યું.','She finished her work.'],
    ['મેં ગઈકાલે એક પુસ્તક ખરીદ્યું.','I bought a book yesterday.'],
    ['તેઓ બજારમાં ગયા હતા.','They went to the market.'],
    ['મારો મિત્ર ગઈકાલે આવ્યો હતો.','My friend came yesterday.'],
    ['મેં તેને ગઈકાલે જોયો હતો.','I saw him yesterday.'],
    ['અમે ગઈકાલે ખૂબ ખુશ હતા.','We were very happy yesterday.'],
    ['તેણે મને મદદ કરી હતી.','He helped me.'],
    ['હું કાલે બજારમાં જઈશ.','I will go to the market tomorrow.'],
    ['તે કાલે આવશે.','He will come tomorrow.'],
    ['અમે આવતા અઠવાડિયે પ્રવાસ કરીશું.','We will travel next week.'],
    ['હું તમને પછીથી ફોન કરીશ.','I will call you later.'],
    ['તે કાલે પરીક્ષા આપશે.','She will take the exam tomorrow.'],
    ['તેઓ સાંજે આવશે.','They will come in the evening.'],
    ['હું તમને મદદ કરીશ.','I will help you.'],
    ['અમે કાલે ક્રિકેટ રમીશું.','We will play cricket tomorrow.'],
    ['તે આવતા મહિને અમદાવાદ જશે.','He will go to Ahmedabad next month.'],
    ['હું અંગ્રેજી શીખતો રહીશ.','I will continue learning English.'],
    ['તમારું નામ શું છે?','What is your name?'],
    ['તમારી ઉંમર કેટલી છે?','How old are you?'],
    ['તમે શું કરો છો?','What do you do?'],
    ['તમારા પિતાનું નામ શું છે?','What is your father’s name?'],
    ['તમારી બહેન ક્યાં છે?','Where is your sister?'],
    ['તમે શાળાએ કેવી રીતે જાઓ છો?','How do you go to school?'],
    ['તમને કયો રંગ ગમે છે?','Which color do you like?'],
    ['તમારો મનપસંદ વિષય કયો છે?','What is your favorite subject?'],
    ['તમે ક્યારે ઊઠો છો?','When do you wake up?'],
    ['તમે અંગ્રેજી કેમ શીખો છો?','Why do you learn English?'],
    ['મને દરરોજ અંગ્રેજી બોલવાની પ્રેક્ટિસ કરવી છે.','I want to practice speaking English every day.'],
    ['મારો મિત્ર ખૂબ સારો છે.','My friend is very good.'],
    ['મારું ઘર શાળાની નજીક છે.','My house is near the school.'],
    ['મને પુસ્તકો વાંચવા ગમે છે.','I like reading books.'],
    ['તે ખૂબ મહેનતુ છોકરો છે.','He is a very hardworking boy.'],
    ['મારી માતા દરરોજ વહેલી સવારે ઊઠે છે.','My mother wakes up early every day.'],
    ['મારો ભાઈ ક્રિકેટ ખૂબ સારી રીતે રમે છે.','My brother plays cricket very well.'],
    ['મારી બહેન સુંદર ચિત્રો દોરે છે.','My sister draws beautiful pictures.'],
    ['અમે દરરોજ સાથે ભોજન કરીએ છીએ.','We eat together every day.'],
    ['મને મારા પરિવાર સાથે સમય પસાર કરવો ગમે છે.','I like spending time with my family.'],
    ['આ મારું નવું ઘર છે.','This is my new house.'],
    ['તે મારી જૂની સાયકલ છે.','That is my old bicycle.'],
    ['ટેબલ પર એક પુસ્તક છે.','There is a book on the table.'],
    ['વર્ગમાં ઘણા વિદ્યાર્થીઓ છે.','There are many students in the class.'],
    ['મારા રૂમમાં બે ખુરશીઓ છે.','There are two chairs in my room.'],
    ['બહાર ખૂબ વરસાદ પડી રહ્યો છે.','It is raining heavily outside.'],
    ['આજે હવામાન ખૂબ સારું છે.','The weather is very nice today.'],
    ['મને આ પ્રશ્નનો જવાબ ખબર છે.','I know the answer to this question.'],
    ['મને આ પ્રશ્ન સમજાતો નથી.','I do not understand this question.'],
    ['કૃપા કરીને દરવાજો બંધ કરો.','Please close the door.'],
    ['કૃપા કરીને મને થોડું પાણી આપો.','Please give me some water.'],
    ['મારી સાથે અહીં બેસો.','Sit here with me.'],
    ['મને તમારું પેન આપશો?','Will you give me your pen?'],
    ['શું તમે મને મદદ કરી શકો છો?','Can you help me?'],
    ['શું હું અંદર આવી શકું?','May I come in?'],
    ['શું તમે મારી વાત સાંભળી રહ્યા છો?','Are you listening to me?'],
    ['મને ખબર નથી.','I do not know.'],
    ['મને લાગે છે કે તે સાચું છે.','I think it is correct.'],
    ['ચિંતા કરશો નહીં.','Do not worry.'],
    ['ધીમે બોલો, કૃપા કરીને.','Please speak slowly.'],
    ['મને ભૂખ લાગી છે.','I am hungry.'],
    ['મને તરસ લાગી છે.','I am thirsty.'],
    ['હું ખૂબ થાકી ગયો છું.','I am very tired.'],
    ['આજે હું ખૂબ ખુશ છું.','I am very happy today.'],
    ['તે અત્યારે બીમાર છે.','He is sick now.'],
    ['મારી તબિયત સારી છે.','I am feeling well.'],
    ['મને અંગ્રેજી શીખવામાં આનંદ આવે છે.','I enjoy learning English.'],
    ['મને નવી વસ્તુઓ શીખવી ગમે છે.','I like learning new things.'],
    ['હું દરરોજ મારી ભૂલો સુધારું છું.','I correct my mistakes every day.'],
    ['હું અંગ્રેજીમાં વધુ સારું બોલવા માંગું છું.','I want to speak better English.']
    ]
  },
  word: {
    title: 'Word Builder', reward: 0.05, dailyLimit: 50,
    questions: [
      ['lpepa','apple'],
    ['raecahte','teacher'],
    ['ohscool','school'],
    ['fneird','friend'],
    ['hpoen','phone'],
    ['mraekt','market'],
    ['wtaer','water'],
    ['flwoer','flower'],
    ['famliy','family'],
    ['cmoeputer','computer'],
    ['hppa y','happy'],
    ['bueatiful','beautiful'],
    ['morinng','morning'],
    ['chlidren','children'],
    ['kictchen','kitchen'],
    ['hosptial','hospital'],
    ['langauge','language'],
    ['qeuestion','question'],
    ['answre','answer'],
    ['strnog','strong'],
    ['tehcar','teacher'],
    ['stduent','student'],
    ['frutis','fruits'],
    ['bananna','banana'],
    ['oragne','orange'],
    ['tabel','table'],
    ['chairr','chair'],
    ['wnidow','window'],
    ['doorr','door'],
    ['housre','house'],
    ['gardne','garden'],
    ['flwoer','flower'],
    ['trree','tree'],
    ['grases','grass'],
    ['moutnain','mountain'],
    ['rveir','river'],
    ['beahc','beach'],
    ['countrry','country'],
    ['vilalge','village'],
    ['citry','city'],
    ['famliy','family'],
    ['motther','mother'],
    ['fathre','father'],
    ['brohter','brother'],
    ['sistter','sister'],
    ['parnets','parents'],
    ['chilren','children'],
    ['grandmtoher','grandmother'],
    ['grandfathre','grandfather'],
    ['uncel','uncle'],
    ['watc h','watch'],
    ['clcok','clock'],
    ['bottel','bottle'],
    ['pencile','pencil'],
    ['notebok','notebook'],
    ['bagag','bag'],
    ['rulre','ruler'],
    ['eraser','eraser'],
    ['deskk','desk'],
    ['blacboard','blackboard'],
    ['morinng','morning'],
    ['afternon','afternoon'],
    ['evennig','evening'],
    ['nigth','night'],
    ['todday','today'],
    ['tomorow','tomorrow'],
    ['yesterdya','yesterday'],
    ['weekk','week'],
    ['mont h','month'],
    ['yeer','year'],
    ['happyy','happy'],
    ['sad d','sad'],
    ['angrry','angry'],
    ['tired d','tired'],
    ['excitt ed','excited'],
    ['hungry y','hungry'],
    ['thirstyy','thirsty'],
    ['afraid d','afraid'],
    ['bravee','brave'],
    ['kindd','kind'],
    ['strongg','strong'],
    ['cleverr','clever'],
    ['smartt','smart'],
    ['honst','honest'],
    ['helpfull','helpful'],
    ['politee','polite'],
    ['carefull','careful'],
    ['beautifull','beautiful'],
    ['importent','important'],
    ['difficul t','difficult'],
    ['enginer','engineer'],
    ['doctro','doctor'],
    ['nursse','nurse'],
    ['farme r','farmer'],
    ['driver r','driver'],
    ['policman','policeman'],
    ['artistt','artist'],
    ['singer r','singer'],
    ['playerr','player'],
    ['workerr','worker'],
    ['breakfas t','breakfast'],
    ['lunchh','lunch'],
    ['dinnerr','dinner'],
    ['vegetabel','vegetable'],
    ['potatto','potato'],
    ['tomatto','tomato'],
    ['sandwhich','sandwich'],
    ['chickenn','chicken'],
    ['milkk','milk'],
    ['coffe e','coffee']
    ]
  },
  fill: {
    title: 'Fill in the Blank', reward: 0.10, dailyLimit: 70,
    questions: [
      ['I ___ a student.',['am','is','are'],'am'],
    ['She ___ to school every day.',['go','goes','going'],'goes'],
    ['They ___ happy.',['is','am','are'],'are'],
    ['He ___ football yesterday.',['play','played','plays'],'played'],
    ['I ___ tea every morning.',['drink','drinks','drank'],'drink'],
    ['We ___ learning English.',['is','are','am'],'are'],
    ['She ___ a new phone.',['have','has','having'],'has'],
    ['You ___ very kind.',['is','are','am'],'are'],
    ['He ___ swim.',['can','cans','can to'],'can'],
    ['I ___ my homework yesterday.',['finish','finished','finishes'],'finished'],

    ['There ___ two books.',['is','are','am'],'are'],
    ['She ___ English well.',['speak','speaks','speaking'],'speaks'],
    ['I ___ going home.',['am','is','are'],'am'],
    ['They ___ cricket now.',['play','are playing','played'],'are playing'],
    ['He ___ breakfast at 8.',['eat','eats','eating'],'eats'],

    ['My father ___ a teacher.',['am','is','are'],'is'],
    ['My mother ___ food every day.',['cook','cooks','cooking'],'cooks'],
    ['We ___ friends.',['am','is','are'],'are'],
    ['Ravi ___ cricket every Sunday.',['play','plays','playing'],'plays'],
    ['She ___ a beautiful dress.',['have','has','having'],'has'],

    ['I ___ English every day.',['learn','learns','learning'],'learn'],
    ['He ___ to work by bus.',['go','goes','going'],'goes'],
    ['They ___ in Ahmedabad.',['live','lives','living'],'live'],
    ['She ___ coffee every morning.',['drink','drinks','drinking'],'drinks'],
    ['We ___ dinner at 8 PM.',['eat','eats','eating'],'eat'],

    ['I ___ very tired today.',['am','is','are'],'am'],
    ['He ___ at home now.',['am','is','are'],'is'],
    ['They ___ in the classroom.',['am','is','are'],'are'],
    ['She ___ my best friend.',['am','is','are'],'is'],
    ['You ___ very helpful.',['am','is','are'],'are'],

    ['I ___ a new book yesterday.',['buy','bought','buys'],'bought'],
    ['She ___ to the market yesterday.',['go','went','goes'],'went'],
    ['He ___ a movie last night.',['watch','watched','watches'],'watched'],
    ['We ___ cricket yesterday.',['play','played','plays'],'played'],
    ['They ___ home late.',['come','came','comes'],'came'],

    ['I ___ him yesterday.',['see','saw','seen'],'saw'],
    ['She ___ her homework.',['finish','finished','finishes'],'finished'],
    ['He ___ a new car last year.',['buy','bought','buys'],'bought'],
    ['We ___ dinner together.',['have','had','has'],'had'],
    ['They ___ the answer.',['know','knew','knows'],'knew'],

    ['I ___ go tomorrow.',['will','am','was'],'will'],
    ['She ___ come tomorrow.',['will','is','was'],'will'],
    ['We ___ visit our grandmother next week.',['will','are','were'],'will'],
    ['He ___ call you later.',['will','does','did'],'will'],
    ['They ___ play football tomorrow.',['will','are','were'],'will'],

    ['I ___ reading a book now.',['am','is','are'],'am'],
    ['She ___ cooking dinner now.',['am','is','are'],'is'],
    ['They ___ watching TV.',['am','is','are'],'are'],
    ['He ___ playing cricket.',['am','is','are'],'is'],
    ['We ___ learning English.',['am','is','are'],'are'],

    ['I ___ like coffee.',['do','does','did'],'do'],
    ['She ___ like tea.',['do','does','did'],'does'],
    ['They ___ play cricket.',['do','does','did'],'do'],
    ['He ___ not understand.',['do','does','did'],'does'],
    ['We ___ not know him.',['do','does','did'],'do'],

    ['___ you speak English?',['Do','Does','Did'],'Do'],
    ['___ she like music?',['Do','Does','Did'],'Does'],
    ['___ they go to school yesterday?',['Do','Does','Did'],'Did'],
    ['___ he play cricket?',['Do','Does','Did'],'Does'],
    ['___ you watch the movie yesterday?',['Do','Does','Did'],'Did'],

    ['There ___ a book on the table.',['is','are','am'],'is'],
    ['There ___ three students here.',['is','are','am'],'are'],
    ['There ___ an apple in the bag.',['is','are','am'],'is'],
    ['There ___ many cars outside.',['is','are','am'],'are'],
    ['There ___ a dog in the garden.',['is','are','am'],'is'],

    ['She ___ very well.',['sing','sings','singing'],'sings'],
    ['He ___ English every day.',['study','studies','studying'],'studies'],
    ['My brother ___ football.',['play','plays','playing'],'plays'],
    ['My sister ___ books.',['read','reads','reading'],'reads'],
    ['The baby ___ a lot.',['cry','cries','crying'],'cries'],

    ['I ___ my room every Sunday.',['clean','cleans','cleaning'],'clean'],
    ['He ___ his teeth every morning.',['brush','brushes','brushing'],'brushes'],
    ['She ___ breakfast at 8 AM.',['have','has','having'],'has'],
    ['We ___ to school together.',['walk','walks','walking'],'walk'],
    ['They ___ English at school.',['learn','learns','learning'],'learn'],

    ['You ___ a good student.',['am','is','are'],'are'],
    ['My friends ___ very helpful.',['is','am','are'],'are'],
    ['The dog ___ hungry.',['is','are','am'],'is'],
    ['The children ___ playing outside.',['is','am','are'],'are'],
    ['My parents ___ at home.',['is','am','are'],'are'],

    ['I ___ never seen this movie.',['have','has','had'],'have'],
    ['She ___ already finished her work.',['have','has','had'],'has'],
    ['They ___ gone to the market.',['have','has','had'],'have'],
    ['He ___ eaten breakfast.',['have','has','had'],'has'],
    ['We ___ completed the project.',['have','has','had'],'have'],

    ['I ___ help you.',['can','cans','can to'],'can'],
    ['She ___ swim very well.',['can','cans','can to'],'can'],
    ['He ___ speak English.',['can','cans','can to'],'can'],
    ['They ___ play football.',['can','cans','can to'],'can'],
    ['We ___ solve this problem.',['can','cans','can to'],'can'],

    ['You ___ study hard.',['should','should to','shoulds'],'should'],
    ['He ___ see a doctor.',['should','should to','shoulds'],'should'],
    ['We ___ help poor people.',['should','should to','shoulds'],'should'],
    ['She ___ drink more water.',['should','should to','shoulds'],'should'],
    ['They ___ arrive on time.',['should','should to','shoulds'],'should'],

    ['I ___ happy yesterday.',['was','were','am'],'was'],
    ['She ___ at school yesterday.',['was','were','is'],'was'],
    ['They ___ tired yesterday.',['was','were','are'],'were'],
    ['We ___ busy last week.',['was','were','are'],'were'],
    ['He ___ sick yesterday.',['was','were','is'],'was'],

    ['I ___ going to the market.',['am','is','are'],'am'],
    ['She ___ going home.',['am','is','are'],'is'],
    ['They ___ going to school.',['am','is','are'],'are'],
    ['He ___ going to work.',['am','is','are'],'is'],
    ['We ___ going to the park.',['am','is','are'],'are']
    ]
  },
  listening: {
    title: 'Listen & Type', reward: 0.15, dailyLimit: 70,
    questions: [
       'I am learning English.',
    'My name is Mahesh.',
    'I go to school every day.',
    'She is my best friend.',
    'What are you doing?',
    'I like to read books.',
    'Please open the door.',
    'He is playing cricket.',
    'I drink water every morning.',
    'We are going to the market.',

    'English is an important language.',
    'I want to improve my speaking.',
    'Today is a beautiful day.',
    'Can you help me please?',
    'I finished my homework.',
    'My father is a teacher.',
    'My mother cooks delicious food.',
    'I have two brothers.',
    'She goes to school every morning.',
    'He likes playing football.',

    'I wake up early every day.',
    'We live in a small village.',
    'My friend lives near my house.',
    'I like drinking tea.',
    'She speaks English very well.',
    'They are playing in the garden.',
    'The children are very happy.',
    'Please close the window.',
    'Where do you live?',
    'What is your name?',

    'I am very busy today.',
    'He is reading a new book.',
    'She is cooking dinner.',
    'We are learning English together.',
    'They are watching television.',
    'I go to the market on Sunday.',
    'My brother plays cricket.',
    'My sister likes music.',
    'The weather is very nice today.',
    'I want to learn new words.',

    'Please give me some water.',
    'Can you speak English?',
    'Do you understand this question?',
    'I need your help.',
    'Please speak slowly.',
    'I am waiting for my friend.',
    'He works in a hospital.',
    'She is a good teacher.',
    'My school is near my house.',
    'I walk to school every day.',

    'Yesterday I went to the market.',
    'I watched a movie last night.',
    'She visited her grandmother yesterday.',
    'He finished his work in the evening.',
    'We played cricket yesterday.',
    'They went to school in the morning.',
    'I bought a new phone yesterday.',
    'My friend called me yesterday.',
    'She cooked dinner for her family.',
    'He helped me with my homework.',

    'I will go to school tomorrow.',
    'She will come here tomorrow.',
    'We will visit the market tomorrow.',
    'He will call you later.',
    'They will play cricket tomorrow.',
    'I will help you with your work.',
    'She will learn English next year.',
    'We will meet again tomorrow.',
    'He will buy a new book.',
    'They will come in the evening.',

    'I am happy to see you.',
    'She is very kind and helpful.',
    'He is my best friend.',
    'My family is very important to me.',
    'I love spending time with my family.',
    'Reading books is my favorite hobby.',
    'I like listening to English songs.',
    'My favorite sport is cricket.',
    'I enjoy learning English.',
    'I practice English every day.',

    'There is a book on the table.',
    'There are two chairs in the room.',
    'There is a dog in the garden.',
    'There are many students in the class.',
    'My room is clean and beautiful.',
    'The door is open.',
    'The window is closed.',
    'My phone is on the table.',
    'The children are in the classroom.',
    'My parents are at home.',

    'What time do you wake up?',
    'What is your favorite food?',
    'Where is your school?',
    'Who is your best friend?',
    'Why are you learning English?',
    'When do you go to school?',
    'How do you go to work?',
    'What are you doing now?',
    'Can you help me with this?',
    'Do you like English?',
    
    'I want to speak English confidently.',
    'I am trying to improve my English.',
    'English is easy when you practice every day.',
    'I learn something new every day.',
    'Never be afraid of making mistakes.',
    'Practice makes you better.',
    'I will keep learning English.',
    'I believe I can speak English well.',
    'I am proud of my progress.',
    'I will never give up learning English.'
    ]
  },
  reading: {
    title: 'Reading Challenge', reward: 0.15, dailyLimit: 70,
    questions: [
      [
        'Riya wakes up at 6 o’clock every morning. She brushes her teeth and goes for a walk.',
        'What can we understand from the paragraph?',
        ['early in the morning','late in the morning','in the morning'],
        'early in the morning'
      ],
      [
        'Amit likes reading books. He reads for thirty minutes every evening.',
        'Which statement is best supported by the paragraph?',
        ['enjoying films','enjoying books','playing a ball game'],
        'enjoying books'
      ],
      [
        'John has a small dog named Bruno. Bruno likes to play in the garden.',
        'Which option best matches the situation described?',
        ['Tom','John','John’s pet dog'],
        'John’s pet dog'
      ],
      [
        'Meena goes to the market on Sunday. She buys vegetables and fruit.',
        'What is the most reasonable conclusion from the paragraph?',
        ['the last weekday','the weekend','the first workday of the week'],
        'the weekend'
      ],
      [
        'Raj studies English every day because he wants to speak confidently.',
        'Which answer best fits the details given?',
        ['to have fun with games','to become confident while speaking','to rest'],
        'to become confident while speaking'
      ],
      [
        'Neha has a blue bicycle. She rides it to school every morning.',
        'What can we understand from the paragraph?',
        ['a warm primary color','a common plant color','a cool-toned primary color'],
        'a cool-toned primary color'
      ],
      [
        'Rahul lives in Ahmedabad with his parents. He works in a small office.',
        'Which statement is best supported by the paragraph?',
        ['his home city','Mumbai','Delhi'],
        'his home city'
      ],
      [
        'Maya likes flowers. Her favorite flower is the rose.',
        'Which option best matches the situation described?',
        ['Sunflower','a fragrant garden flower','Lotus'],
        'a fragrant garden flower'
      ],
      [
        'Arjun plays cricket every evening with his friends in the park.',
        'What is the most reasonable conclusion from the paragraph?',
        ['nightly','each evening','each morning'],
        'each evening'
      ],
      [
        'Sara has two brothers and one sister. They all live together.',
        'Which answer best fits the details given?',
        ['a single story','a group of three','a pair'],
        'a pair'
      ],
      [
        'Karan drinks milk every morning before going to school.',
        'What can we understand from the paragraph?',
        ['a hot beverage','a fruit-based drink','a dairy drink'],
        'a dairy drink'
      ],
      [
        'Priya is a teacher. She teaches English to young students.',
        'Which statement is best supported by the paragraph?',
        ['Maths','the language he/she is learning','the subject about the natural world'],
        'the language he/she is learning'
      ],
      [
        'Vijay bought a new phone yesterday. The phone is black.',
        'Which option best matches the situation described?',
        ['White','a cool-toned primary color','a very dark color'],
        'a very dark color'
      ],
      [
        'Anita goes for a walk every morning. She usually walks for thirty minutes.',
        'What is the most reasonable conclusion from the paragraph?',
        ['sixty minutes','a brief period of time','half an hour'],
        'half an hour'
      ],
      [
        'Rohan likes football. He watches football matches on television every weekend.',
        'Which answer best fits the details given?',
        ['Cricket','Tennis','a sport played mainly with the feet'],
        'a sport played mainly with the feet'
      ],
      [
        'Pooja has a cat named Kitty. Kitty likes sleeping on the sofa.',
        'What can we understand from the paragraph?',
        ['Pooja','Mimi','Pooja’s pet cat'],
        'Pooja’s pet cat'
      ],
      [
        'Dev wakes up early because he has to catch the school bus at seven o’clock.',
        'Which statement is best supported by the paragraph?',
        ['To play cricket','to reach the school transport on time','To watch TV'],
        'to reach the school transport on time'
      ],
      [
        'Nisha loves cooking. She makes delicious food for her family every Sunday.',
        'Which option best matches the situation described?',
        ['Dancing','Singing','preparing food'],
        'preparing food'
      ],
      [
        'Aman has a small garden behind his house. He grows tomatoes and flowers there.',
        'What is the most reasonable conclusion from the paragraph?',
        ['Rice and wheat','food crops and decorative plants','Apples and mangoes'],
        'food crops and decorative plants'
      ],
      [
        'Mehul goes to the library every Saturday. He borrows two books each time.',
        'Which answer best fits the details given?',
        ['the weekend','the first workday of the week','the weekend day before Sunday'],
        'the weekend day before Sunday'
      ],
      [
        'Ravi is very hardworking. He studies for two hours every evening.',
        'What can we understand from the paragraph?',
        ['sixty minutes','Three hours','a two-hour period'],
        'a two-hour period'
      ],
      [
        'Kavya likes music. She listens to English songs before going to bed.',
        'Which statement is best supported by the paragraph?',
        ['News','Stories','songs performed in English'],
        'songs performed in English'
      ],
      [
        'Harsh has a red school bag. He keeps his books and notebooks inside it.',
        'Which option best matches the situation described?',
        ['a cool-toned primary color','a very dark color','a warm primary color'],
        'a warm primary color'
      ],
      [
        'Isha visits her grandmother every weekend. Her grandmother lives in a nearby village.',
        'What is the most reasonable conclusion from the paragraph?',
        ['Her teacher','a female friend','an older female relative'],
        'an older female relative'
      ],
      [
        'Manav loves animals. He wants to become a veterinarian when he grows up.',
        'Which answer best fits the details given?',
        ['A teacher','A driver','an animal doctor'],
        'an animal doctor'
      ],
      [
        'Sonal wakes up at seven and has breakfast before going to work.',
        'What can we understand from the paragraph?',
        ['After going to work','At night','before starting the workday'],
        'before starting the workday'
      ],
      [
        'Yash bought three apples and two bananas from the market.',
        'Which statement is best supported by the paragraph?',
        ['a pair','a total of five','a group of three'],
        'a group of three'
      ],
      [
        'Komal is learning English because she wants to work in another country.',
        'Which option best matches the situation described?',
        ['to have fun with games','to get a job overseas','To watch movies'],
        'to get a job overseas'
      ],
      [
        'A school bus arrives at eight o’clock every morning. The students wait near the gate.',
        'What is the most reasonable conclusion from the paragraph?',
        ['at seven in the evening','At nine o’clock','in the morning at the scheduled time'],
        'in the morning at the scheduled time'
      ],
      [
        'Milan has a pet parrot named Mithu. Mithu can say a few words.',
        'Which answer best fits the details given?',
        ['Milan','Raju','Milan’s pet parrot'],
        'Milan’s pet parrot'
      ],
      [
        'Rina likes painting. She paints pictures of flowers, trees, and mountains.',
        'What can we understand from the paragraph?',
        ['Dancing','preparing food','creating pictures with paint'],
        'creating pictures with paint'
      ],
      [
        'Jay works at a hospital. He helps doctors and takes care of patients.',
        'Which statement is best supported by the paragraph?',
        ['At a school','at a financial institution','at a place where patients receive medical care'],
        'at a place where patients receive medical care'
      ],
      [
        'Tina drinks a glass of water after waking up every morning.',
        'Which option best matches the situation described?',
        ['a dairy drink','a fruit-based drink','a simple hydrating drink'],
        'a simple hydrating drink'
      ],
      [
        'Nitin has a blue car. He drives it to work every day.',
        'What is the most reasonable conclusion from the paragraph?',
        ['a very dark color','White','a cool-toned primary color'],
        'a cool-toned primary color'
      ],
      [
        'Asha enjoys gardening. She plants new flowers in her garden every month.',
        'Which answer best fits the details given?',
        ['Reading','Swimming','taking care of plants'],
        'taking care of plants'
      ],
      [
        'Rakesh went to the beach with his family last Sunday. They played in the sand.',
        'What can we understand from the paragraph?',
        ['to an outdoor recreation area','To the market','to a seaside place'],
        'to a seaside place'
      ],
      [
        'Divya studies at night because her house is quiet after dinner.',
        'Which statement is best supported by the paragraph?',
        ['Because she likes sleeping','Because school is closed','because the home environment is peaceful'],
        'because the home environment is peaceful'
      ],
      [
        'A small bird built a nest in the tree near Ravi’s house.',
        'Which option best matches the situation described?',
        ['On a roof','In a box','up in the branches of a tree'],
        'up in the branches of a tree'
      ],
      [
        'Sahil bought a new pair of shoes because his old shoes were damaged.',
        'What is the most reasonable conclusion from the paragraph?',
        ['He lost his bag','He wanted a bicycle','his previous pair could no longer be used'],
        'his previous pair could no longer be used'
      ],
      [
        'Mira goes to the gym three times a week. She exercises for one hour each time.',
        'Which answer best fits the details given?',
        ['Every day','Once a month','on three days each week'],
        'on three days each week'
      ],
      [
        'Vishal loves mangoes. During summer, he eats them almost every day.',
        'What can we understand from the paragraph?',
        ['Apples','Oranges','a tropical summer fruit'],
        'a tropical summer fruit'
      ],
      [
        'Reema has a beautiful dress for her sister’s wedding. The dress is pink.',
        'Which statement is best supported by the paragraph?',
        ['Yellow','a common plant color','a light shade of red'],
        'a light shade of red'
      ],
      [
        'A boy named Sam helps his mother clean the house every Saturday.',
        'Which option best matches the situation described?',
        ['Every Monday','Every Sunday','each Saturday'],
        'each Saturday'
      ],
      [
        'Lalit is learning to drive. He practices with his father every evening.',
        'What is the most reasonable conclusion from the paragraph?',
        ['His brother','His friend','his dad'],
        'his dad'
      ],
      [
        'The train leaves the station at nine in the morning. Many passengers are waiting.',
        'Which answer best fits the details given?',
        ['At ten at night','At eight in the evening','at nine during the morning'],
        'at nine during the morning'
      ],
      [
        'A family went to the zoo on Sunday. They saw lions, elephants, and monkeys.',
        'What can we understand from the paragraph?',
        ['To the museum','to a seaside place','to a place where many animals are kept'],
        'to a place where many animals are kept'
      ],
      [
        'Ritu likes chocolate ice cream. She usually eats it after dinner.',
        'Which statement is best supported by the paragraph?',
        ['Vanilla','Mango','a cocoa-based flavor'],
        'a cocoa-based flavor'
      ],
      [
        'Mohan has a small shop near the bus station. He sells books and stationery.',
        'Which option best matches the situation described?',
        ['Clothes and shoes','Vegetables and fruit','reading materials and writing supplies'],
        'reading materials and writing supplies'
      ],
      [
        'Aarti is preparing for her English exam. She studies grammar and vocabulary every day.',
        'What is the most reasonable conclusion from the paragraph?',
        ['A music exam','A driving test','a test of English'],
        'a test of English'
      ],
      [
        'The children went to the park after school. They played on the swings.',
        'Which answer best fits the details given?',
        ['To the library','To the hospital','to an outdoor recreation area'],
        'to an outdoor recreation area'
      ],
      [
        'Vivek likes swimming. He goes to the swimming pool every Wednesday.',
        'What can we understand from the paragraph?',
        ['the last weekday','the weekend','the middle weekday'],
        'the middle weekday'
      ],
      [
        'Sita keeps her important documents in a drawer in her bedroom.',
        'Which statement is best supported by the paragraph?',
        ['In a bag','Under the bed','inside a storage compartment'],
        'inside a storage compartment'
      ],
      [
        'A farmer works in his field from early morning until afternoon.',
        'Which option best matches the situation described?',
        ['In an office','In a shop','on the farmland he works'],
        'on the farmland he works'
      ],
      [
        'Neeraj bought a birthday gift for his best friend. He bought a watch.',
        'What is the most reasonable conclusion from the paragraph?',
        ['A phone','A book','a timekeeping device'],
        'a timekeeping device'
      ],
      [
        'The teacher gave the students homework on Monday. They had to finish it by Friday.',
        'Which answer best fits the details given?',
        ['the last weekday','the weekend','the first workday of the week'],
        'the first workday of the week'
      ],
      [
        'Mansi enjoys watching movies with her family on Saturday nights.',
        'What can we understand from the paragraph?',
        ['Sunday mornings','Monday afternoons','Saturday evenings'],
        'Saturday evenings'
      ],
      [
        'A young boy found a lost wallet near the school gate. He gave it to his teacher.',
        'Which statement is best supported by the paragraph?',
        ['In the classroom','At home','beside the entrance of the school'],
        'beside the entrance of the school'
      ],
      [
        'Kishan goes jogging every morning before breakfast.',
        'Which option best matches the situation described?',
        ['later in the evening','At midnight','earlier than the morning meal'],
        'earlier than the morning meal'
      ],
      [
        'The shop opens at ten in the morning and closes at eight in the evening.',
        'What is the most reasonable conclusion from the paragraph?',
        ['At eight in the morning','At nine at night','during the morning'],
        'during the morning'
      ],
      [
        'Pinal has a small notebook. She writes new English words in it every day.',
        'Which answer best fits the details given?',
        ['Stories','Phone numbers','fresh vocabulary'],
        'fresh vocabulary'
      ],
      [
        'Amit’s favorite subject at school is science. He wants to become a scientist.',
        'What can we understand from the paragraph?',
        ['the language he/she is learning','History','the subject about the natural world'],
        'the subject about the natural world'
      ],
      [
        'Rupal went shopping with her mother and bought a new pair of shoes.',
        'Which statement is best supported by the paragraph?',
        ['Her sister','a female friend','her female parent'],
        'her female parent'
      ],
      [
        'The family had dinner together at seven o’clock in the evening.',
        'Which option best matches the situation described?',
        ['At six o’clock','At nine o’clock','at seven in the evening'],
        'at seven in the evening'
      ],
      [
        'A boy named Rohit loves drawing. He draws pictures in his notebook after school.',
        'What is the most reasonable conclusion from the paragraph?',
        ['Swimming','Reading','making pictures by hand'],
        'making pictures by hand'
      ],
      [
        'Sneha has an English class every Tuesday and Thursday.',
        'Which answer best fits the details given?',
        ['Monday and Friday','Wednesday and Saturday','two weekdays in the middle and later part of the week'],
        'two weekdays in the middle and later part of the week'
      ],
      [
        'A man was waiting for a bus when he saw his old friend across the street.',
        'What can we understand from the paragraph?',
        ['A train','A taxi','public road transport'],
        'public road transport'
      ],
      [
        'Pooja cleaned her room because her friends were coming to visit her.',
        'Which statement is best supported by the paragraph?',
        ['She was going to school','She wanted to sleep','visitors were expected'],
        'visitors were expected'
      ],
      [
        'The library is closed on Sunday, so Rahul visits it on Saturday.',
        'Which option best matches the situation described?',
        ['He has school on Sunday','He works there','the library is unavailable that day'],
        'the library is unavailable that day'
      ],
      [
        'A farmer has ten cows and five goats on his farm.',
        'What is the most reasonable conclusion from the paragraph?',
        ['a total of five','Fifteen','a total of ten'],
        'a total of ten'
      ],
      [
        'Meena bought vegetables, fruits, and milk from the supermarket.',
        'Which answer best fits the details given?',
        ['School','Hospital','a large food store'],
        'a large food store'
      ],
      [
        'A young girl named Tara loves reading storybooks before going to bed.',
        'What can we understand from the paragraph?',
        ['earlier than the morning meal','At school','just before sleeping'],
        'just before sleeping'
      ],
      [
        'Rajesh works from Monday to Friday and rests on Saturday and Sunday.',
        'Which statement is best supported by the paragraph?',
        ['Monday and Tuesday','Wednesday and Thursday','the two weekend days'],
        'the two weekend days'
      ],
      [
        'Kiran has a small computer on his desk. He uses it for studying English.',
        'Which option best matches the situation described?',
        ['For playing cricket','For cooking','for learning the English language'],
        'for learning the English language'
      ],
      [
        'A woman named Lata grows vegetables in her backyard. She grows tomatoes and potatoes.',
        'What is the most reasonable conclusion from the paragraph?',
        ['Carrots and onions','Beans and peas','two vegetables grown in the garden'],
        'two vegetables grown in the garden'
      ],
      [
        'The students listened carefully while the teacher explained the lesson.',
        'Which answer best fits the details given?',
        ['The students','The principal','the person conducting the lesson'],
        'the person conducting the lesson'
      ],
      [
        'Arun forgot his umbrella, so he got wet while walking home in the rain.',
        'What can we understand from the paragraph?',
        ['He went swimming','He washed his clothes','he went out without rain protection'],
        'he went out without rain protection'
      ],
      [
        'A family has a large dog named Max. Max sleeps outside the house at night.',
        'Which statement is best supported by the paragraph?',
        ['in the room used for cooking','In the car','in the open area around the home'],
        'in the open area around the home'
      ],
      [
        'Naina practices speaking English with her friend every evening.',
        'Which option best matches the situation described?',
        ['Her teacher','Her brother','a female friend'],
        'a female friend'
      ],
      [
        'The bus was late because there was heavy traffic on the road.',
        'What is the most reasonable conclusion from the paragraph?',
        ['Because of rain','Because of an accident','because the roads were very busy'],
        'because the roads were very busy'
      ],
      [
        'Suresh saves some money every month because he wants to buy a new laptop.',
        'Which answer best fits the details given?',
        ['To buy a bicycle','To travel abroad','to save for a new computer'],
        'to save for a new computer'
      ],
      [
        'A girl named Rani has a beautiful garden. She waters the plants every morning.',
        'What can we understand from the paragraph?',
        ['each evening','Every Sunday','each morning'],
        'each morning'
      ],
      [
        'The students went to the museum to learn about history.',
        'Which statement is best supported by the paragraph?',
        ['to have fun with games','To buy books','to gain knowledge of the past'],
        'to gain knowledge of the past'
      ],
      [
        'A man named Deepak rides his bicycle to work because his office is close to his home.',
        'Which option best matches the situation described?',
        ['He does not have a car','He likes buses','his workplace is nearby'],
        'his workplace is nearby'
      ],
      [
        'Kajal drinks warm milk before sleeping every night.',
        'What is the most reasonable conclusion from the paragraph?',
        ['Cold water','a hot beverage','a heated dairy drink'],
        'a heated dairy drink'
      ],
      [
        'A boy named Amar wants to improve his English, so he reads English newspapers every morning.',
        'Which answer best fits the details given?',
        ['Storybooks','Magazines','newspapers written in English'],
        'newspapers written in English'
      ],
      [
        'The family visited a hill station during their summer vacation. They enjoyed the cool weather.',
        'What can we understand from the paragraph?',
        ['During winter','During the rainy season','during the school holiday in summer'],
        'during the school holiday in summer'
      ],
      [
        'Ramesh keeps his bicycle in the garage when he is not using it.',
        'Which statement is best supported by the paragraph?',
        ['In the garden','In his bedroom','in the vehicle storage area'],
        'in the vehicle storage area'
      ],
      [
        'A teacher asked the students to write five sentences in English.',
        'Which option best matches the situation described?',
        ['A story','A letter','five written sentences in English'],
        'five written sentences in English'
      ],
      [
        'Mitali goes to bed at ten o’clock because she wakes up early for school.',
        'What is the most reasonable conclusion from the paragraph?',
        ['She is tired from work','She has dinner late','her school schedule starts early'],
        'her school schedule starts early'
      ],
      [
        'A boy named Kunal found a small puppy in the street and took it home.',
        'Which answer best fits the details given?',
        ['A kitten','A bird','a young dog'],
        'a young dog'
      ],
      [
        'Riya’s family celebrates her birthday every year with a small party at home.',
        'What can we understand from the paragraph?',
        ['With a trip','At a restaurant','with a modest celebration at home'],
        'with a modest celebration at home'
      ],
      [
        'Anil wants to become a doctor because he likes helping sick people.',
        'Which statement is best supported by the paragraph?',
        ['He likes teaching','He likes driving','he wants to help ill people'],
        'he wants to help ill people'
      ],
      [
        'The girl opened the window because the room was very hot.',
        'Which option best matches the situation described?',
        ['It was raining','She wanted to sleep','the room had excessive heat'],
        'the room had excessive heat'
      ],
      [
        'Mohan visits his uncle every month. His uncle lives in another city.',
        'What is the most reasonable conclusion from the paragraph?',
        ['Every week','Every day','once each month'],
        'once each month'
      ],
      [
        'A student named Ravi studies for his exams every evening and takes short breaks.',
        'Which answer best fits the details given?',
        ['each morning','Only on weekends','each evening'],
        'each evening'
      ],
      [
        'The children planted five trees near their school as part of an environment project.',
        'What can we understand from the paragraph?',
        ['a group of three','a total of ten','a total of five'],
        'a total of five'
      ],
      [
        'A woman named Seema goes to the market early because it is less crowded in the morning.',
        'Which statement is best supported by the paragraph?',
        ['She has no time','The market closes early','there are fewer people around'],
        'there are fewer people around'
      ],
      [
        'Vikas enjoys cycling on weekends. He usually cycles for two hours with his friends.',
        'Which option best matches the situation described?',
        ['sixty minutes','Three hours','a two-hour period'],
        'a two-hour period'
      ],
      [
        'The English teacher gave the class a simple story to read and discuss.',
        'What is the most reasonable conclusion from the paragraph?',
        ['A difficult test','A poem','an easy-to-read story'],
        'an easy-to-read story'
      ],
      [
        'A family went to a restaurant to celebrate their father’s birthday.',
        'Which answer best fits the details given?',
        ['To study','To buy clothes','to mark their father’s birthday'],
        'to mark their father’s birthday'
      ],
      [
        'Nikhil drinks fresh fruit juice after his morning exercise.',
        'What can we understand from the paragraph?',
        ['a hot beverage','Coffee','a drink made from fresh fruit'],
        'a drink made from fresh fruit'
      ],
      [
        'Priti keeps a diary and writes about her day every night before sleeping.',
        'Which statement is best supported by the paragraph?',
        ['each morning','Every Sunday','nightly'],
        'nightly'
      ],
      [
        'A boy named Jay loves helping his father in the garden during the weekend.',
        'Which option best matches the situation described?',
        ['His mother','His teacher','his dad'],
        'his dad'
      ],
      [
        'The train arrived late because of heavy rain.',
        'What is the most reasonable conclusion from the paragraph?',
        ['Because of traffic','Because of a broken road','because of very strong rainfall'],
        'because of very strong rainfall'
      ],
      [
        'Rohini bought a dictionary because she wanted to learn new English words.',
        'Which answer best fits the details given?',
        ['To read stories','To write letters','to expand English vocabulary'],
        'to expand English vocabulary'
      ],
      [
        'A family lives in a small house near a river. They enjoy walking beside the river in the evening.',
        'What can we understand from the paragraph?',
        ['Near a mountain','Near a school','close to a river'],
        'close to a river'
      ],
      [
        'A student named Varun practices English speaking for twenty minutes every morning.',
        'Which statement is best supported by the paragraph?',
        ['half an hour','sixty minutes','one third of an hour'],
        'one third of an hour'
      ],
      [
        'The shopkeeper arranged all the books neatly on the shelf before opening the shop.',
        'Which option best matches the situation described?',
        ['Shoes','Vegetables','reading material'],
        'reading material'
      ],
      [
        'A girl named Nisha saved her pocket money for three months to buy a school bag.',
        'What is the most reasonable conclusion from the paragraph?',
        ['To buy a phone','To buy a bicycle','to save for a bag used at school'],
        'to save for a bag used at school'
      ],
      [
        'Rahul and his friends planted flowers in the school garden on Friday.',
        'Which answer best fits the details given?',
        ['the first workday of the week','the weekend','the last weekday'],
        'the last weekday'
      ],
      [
        'A man named Ajay reads the newspaper every morning while drinking tea.',
        'What can we understand from the paragraph?',
        ['Coffee','a dairy drink','a hot beverage'],
        'a hot beverage'
      ],
      [
        'The students cleaned their classroom before the teacher arrived.',
        'Which statement is best supported by the paragraph?',
        ['the outdoor sports area','The library','the room where they study'],
        'the room where they study'
      ],
      [
        'Maya wants to travel to London someday because she wants to see famous places there.',
        'Which option best matches the situation described?',
        ['Paris','New York','the British capital'],
        'the British capital'
      ],
      [
        'A boy named Rohan studies hard because he wants to get good marks in his exams.',
        'What is the most reasonable conclusion from the paragraph?',
        ['to have fun with games','To watch movies','to achieve high exam scores'],
        'to achieve high exam scores'
      ],
      [
        'The family ate dinner together and talked about their day.',
        'Which answer best fits the details given?',
        ['They watched a movie','They played cricket','they discussed what happened during the day'],
        'they discussed what happened during the day'
      ],
      [
        'A woman named Priya works at a bank. She helps customers with their accounts.',
        'What can we understand from the paragraph?',
        ['At a school','at a place where patients receive medical care','at a financial institution'],
        'at a financial institution'
      ],
      [
        'The boy opened his English book and started reading the lesson.',
        'Which statement is best supported by the paragraph?',
        ['A newspaper','A letter','the lesson in the English book'],
        'the lesson in the English book'
      ],
      [
        'Anita likes visiting new places. She travels with her family during holidays.',
        'Which option best matches the situation described?',
        ['each morning','Every weekend','while on vacation'],
        'while on vacation'
      ],
      [
        'A student named Harish made a daily plan to practice English, read books, and exercise.',
        'What is the most reasonable conclusion from the paragraph?',
        ['A shopping list','A school bag','a schedule for the day'],
        'a schedule for the day'
      ],
      [
        'The little girl was tired after playing in the park for two hours.',
        'Which answer best fits the details given?',
        ['She studied all day','She walked to school','two hours of outdoor play caused her tiredness'],
        'two hours of outdoor play caused her tiredness'
      ],
      [
        'A family bought a new television because their old television stopped working.',
        'What can we understand from the paragraph?',
        ['They wanted a bigger room','They moved house','their previous device no longer functioned'],
        'their previous device no longer functioned'
      ],
      [
        'Kiran wakes up at six, exercises for thirty minutes, and then takes a shower.',
        'Which statement is best supported by the paragraph?',
        ['He eats dinner','He goes to bed','he washes himself after exercise'],
        'he washes himself after exercise'
      ],
      [
        'A teacher told the students to speak English for five minutes every day.',
        'Which option best matches the situation described?',
        ['a brief period of time','half an hour','a brief five-minute period'],
        'a brief five-minute period'
      ],
      [
        'Ravi bought a notebook to write down new words while learning English.',
        'What is the most reasonable conclusion from the paragraph?',
        ['To draw pictures','To write stories','to record new vocabulary'],
        'to record new vocabulary'
      ],
      [
        'The children were excited because their school was going on a picnic the next day.',
        'Which answer best fits the details given?',
        ['Because of an exam','Because school was closed','because a school outing was planned'],
        'because a school outing was planned'
      ],
      [
        'A woman named Meera makes tea every morning for her family.',
        'What can we understand from the paragraph?',
        ['Coffee','a fruit-based drink','a hot beverage'],
        'a hot beverage'
      ],
      [
        'A boy named Dev practices writing English sentences in his notebook every evening.',
        'Which statement is best supported by the paragraph?',
        ['Playing cricket','Reading newspapers','writing sentences in the English language'],
        'writing sentences in the English language'
      ],
      [
        'The family went to the park after dinner and walked for thirty minutes.',
        'Which option best matches the situation described?',
        ['earlier than the morning meal','At noon','later in the evening'],
        'later in the evening'
      ],
      [
        'A student named Pooja wants to improve her vocabulary, so she learns five new words every day.',
        'What is the most reasonable conclusion from the paragraph?',
        ['a total of ten','a group of three','a total of five'],
        'a total of five'
      ],
      [
        'The shopkeeper closed the shop at nine o’clock because there were no customers left.',
        'Which answer best fits the details given?',
        ['It was raining','He was going to school','the shop had no remaining customers'],
        'the shop had no remaining customers'
      ],
      [
        'A family visited their grandparents during the weekend and stayed there for two days.',
        'What can we understand from the paragraph?',
        ['One day','One week','a forty-eight-hour stay'],
        'a forty-eight-hour stay'
      ],
      [
        'A boy named Aman helps his younger sister with her homework every evening.',
        'Which statement is best supported by the paragraph?',
        ['His brother','His friend','his younger female sibling'],
        'his younger female sibling'
      ],
      [
        'Rina drinks a glass of milk before going to school every morning.',
        'Which option best matches the situation described?',
        ['later in the evening','Before sleeping','before the school day begins'],
        'before the school day begins'
      ],
      [
        'The students were happy because they won the school cricket match.',
        'What is the most reasonable conclusion from the paragraph?',
        ['They finished homework','They got new books','their team was victorious in cricket'],
        'their team was victorious in cricket'
      ],
      [
        'A man named Suresh reads English news online every morning to improve his vocabulary.',
        'Which answer best fits the details given?',
        ['To watch cricket','To learn cooking','to build a larger word bank'],
        'to build a larger word bank'
      ],
      [
        'A girl named Riya keeps her school books in a large blue bag.',
        'What can we understand from the paragraph?',
        ['On the table','In the cupboard','inside a big school bag of a cool color'],
        'inside a big school bag of a cool color'
      ],
      [
        'The family prepared a special meal because guests were coming for dinner.',
        'Which statement is best supported by the paragraph?',
        ['It was Sunday','They were going shopping','visitors were expected'],
        'visitors were expected'
      ],
      [
        'A student named Amit practices listening to English every day using short audio lessons.',
        'Which option best matches the situation described?',
        ['Writing stories','Playing music','practising understanding spoken English'],
        'practising understanding spoken English'
      ],
      [
        'The teacher praised Neha because she completed all her homework on time.',
        'What is the most reasonable conclusion from the paragraph?',
        ['She won a race','She cleaned the classroom','she finished her assigned work before the deadline'],
        'she finished her assigned work before the deadline'
      ],
      [
        'A boy named Rahul wants to speak English confidently, so he talks to his friends in English.',
        'Which answer best fits the details given?',
        ['to have fun with games','To practice writing','to become more confident speaking English'],
        'to become more confident speaking English'
      ],
      [
        'The family went for a walk after breakfast because the weather was pleasant.',
        'What can we understand from the paragraph?',
        ['They were hungry','It was raining','the conditions outside were comfortable'],
        'the conditions outside were comfortable'
      ],
      [
        'A woman named Kavita works from home and starts her work at nine in the morning.',
        'Which statement is best supported by the paragraph?',
        ['At eight in the evening','At ten at night','at nine during the morning'],
        'at nine during the morning'
      ],
      [
        'A young boy named Arjun reads one English story every night before sleeping.',
        'Which option best matches the situation described?',
        ['a pair','a group of three','a single story'],
        'a single story'
      ],
      [
        'The students practiced speaking English together during their lunch break.',
        'What is the most reasonable conclusion from the paragraph?',
        ['Before school','later in the evening','during the midday school break'],
        'during the midday school break'
      ],
      [
        'A family bought fresh vegetables from the local market on Saturday morning.',
        'Which answer best fits the details given?',
        ['Sunday evening','Monday afternoon','the morning of the weekend'],
        'the morning of the weekend'
      ],
      [
        'A girl named Meena wants to become a teacher because she enjoys helping children learn.',
        'What can we understand from the paragraph?',
        ['She likes travelling','She likes cooking','she likes supporting children’s learning'],
        'she likes supporting children’s learning'
      ],
      [
        'A boy named Kunal drinks water regularly because he wants to stay healthy.',
        'Which statement is best supported by the paragraph?',
        ['To become taller','To sleep better','to maintain good health'],
        'to maintain good health'
      ],
      [
        'The school organized a speaking competition, and many students participated.',
        'Which option best matches the situation described?',
        ['A drawing competition','A running competition','a contest involving spoken English'],
        'a contest involving spoken English'
      ],
      [
        'A student named Rohan won the speaking competition because he spoke English clearly.',
        'What is the most reasonable conclusion from the paragraph?',
        ['He ran quickly','He drew a picture','his spoken English was easy to understand'],
        'his spoken English was easy to understand'
      ],
      [
        'The teacher gave the students ten minutes to complete the reading activity.',
        'Which answer best fits the details given?',
        ['a brief five-minute period','one third of an hour','a brief period of time'],
        'a brief period of time'
      ],
      [
        'A family went to the beach early in the morning to watch the sunrise.',
        'What can we understand from the paragraph?',
        ['To swim at night','To eat lunch','to see the sun appear in the morning'],
        'to see the sun appear in the morning'
      ],
      [
        'A boy named Jay keeps practicing English even when he makes mistakes.',
        'Which statement is best supported by the paragraph?',
        ['He stops learning','He gets angry','he continues trying instead of stopping'],
        'he continues trying instead of stopping'
      ],
      [
        'A girl named Nisha writes five English sentences every day in her notebook.',
        'Which option best matches the situation described?',
        ['a total of ten','a group of three','a total of five'],
        'a total of five'
      ],
      [
        'The students learned new vocabulary words and used them in sentences.',
        'What is the most reasonable conclusion from the paragraph?',
        ['New games','New songs','new words and their meanings'],
        'new words and their meanings'
      ],
      [
        'A man named Ravi listens to English podcasts while traveling to work.',
        'Which answer best fits the details given?',
        ['While sleeping','While cooking dinner','during the journey to his workplace'],
        'during the journey to his workplace'
      ],
      [
        'A family has breakfast together every Sunday morning.',
        'What can we understand from the paragraph?',
        ['Every Saturday night','Every Monday morning','on Sunday mornings'],
        'on Sunday mornings'
      ],
      [
        'A teacher named Priya encourages her students to speak English without fear.',
        'Which statement is best supported by the paragraph?',
        ['Play games','Write exams','use English confidently without being afraid'],
        'use English confidently without being afraid'
      ],
      [
        'A student named Aman learned ten new English words this week.',
        'Which option best matches the situation described?',
        ['a total of five','Twenty','a total of ten'],
        'a total of ten'
      ],
      [
        'The children cleaned the playground before their sports activity.',
        'What is the most reasonable conclusion from the paragraph?',
        ['The classroom','The library','the outdoor sports area'],
        'the outdoor sports area'
      ],
      [
        'A girl named Riya practices English pronunciation every morning.',
        'Which answer best fits the details given?',
        ['Maths','making pictures by hand','the way English words are spoken'],
        'the way English words are spoken'
      ],
      [
        'A boy named Arjun helps his mother in the kitchen every evening.',
        'What can we understand from the paragraph?',
        ['In the garden','In the classroom','in the room used for cooking'],
        'in the room used for cooking'
      ],
      [
        'The family watched an English movie together to practice listening.',
        'Which statement is best supported by the paragraph?',
        ['To learn cooking','to have fun with games','to improve understanding of spoken language'],
        'to improve understanding of spoken language'
      ],
      [
        'A student named Neha reads a short English article every morning.',
        'Which option best matches the situation described?',
        ['A comic book','A newspaper in Gujarati','a brief article written in English'],
        'a brief article written in English'
      ],
      [
        'A man named Vijay practices speaking English with his colleague during lunch.',
        'What is the most reasonable conclusion from the paragraph?',
        ['His brother','His teacher','a person he works with'],
        'a person he works with'
      ],
      [
        'A girl named Pooja wants to improve her grammar, so she studies grammar rules every evening.',
        'Which answer best fits the details given?',
        ['To learn drawing','To play cricket','to become better at English grammar'],
        'to become better at English grammar'
      ],
      [
        'The students completed their reading challenge and received a small reward.',
        'What can we understand from the paragraph?',
        ['A new book','A certificate','a modest prize'],
        'a modest prize'
      ],
      [
        'A boy named Ravi practices English for thirty minutes every day before going to bed.',
        'Which statement is best supported by the paragraph?',
        ['one third of an hour','sixty minutes','half an hour'],
        'half an hour'
      ],
      [
        'The teacher asked everyone to read the passage carefully before answering the questions.',
        'Which option best matches the situation described?',
        ['Close the books','Go outside','study the passage closely'],
        'study the passage closely'
      ],
      [
        'A student named Mehul enjoys reading because books help him learn new things.',
        'What is the most reasonable conclusion from the paragraph?',
        ['Books are expensive','He wants to sleep','reading gives him new knowledge'],
        'reading gives him new knowledge'
      ],
      [
        'A family spends one hour together every evening talking about their day.',
        'Which answer best fits the details given?',
        ['half an hour','a two-hour period','sixty minutes'],
        'sixty minutes'
      ],
      [
        'A girl named Tara practices English every day and feels more confident now.',
        'What can we understand from the paragraph?',
        ['More tired','More nervous','more sure of herself'],
        'more sure of herself'
      ],
      [
        'A boy named Karan never gives up when he finds a difficult English word.',
        'Which statement is best supported by the paragraph?',
        ['He stops reading','He ignores them','he does not give up'],
        'he does not give up'
      ],
      [
        'The teacher told the students that regular practice is the key to improving English.',
        'Which option best matches the situation described?',
        ['Watching television','Sleeping more','practising consistently'],
        'practising consistently'
      ],
      [
        'A student named Riya wants to speak English fluently, so she practices every day.',
        'What is the most reasonable conclusion from the paragraph?',
        ['To learn dancing','To play sports','to become fluent in spoken English'],
        'to become fluent in spoken English'
      ]
    ]
  },  speaking: {
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

function mapGet(map, key) {
  if (!map) return 0;
  if (typeof map.get === 'function') return Number(map.get(key) || 0);
  return Number(map[key] || 0);
}
function mapSet(map, key, value) {
  if (map && typeof map.set === 'function') map.set(key, value);
  else if (map) map[key] = value;
}
function pickRandomQuestions(type, activity, user) {
  const all = activity.questions.map((q,i)=>({id:i,...publicQuestion(type,q)}));
  if (!all.length) return [];
  const last = mapGet(user?.activityLastQuestion, type);
  const shuffled = all.sort(() => Math.random() - 0.5);
  const withoutLast = shuffled.filter(x => x.id !== last);
  return (withoutLast.length ? withoutLast : shuffled).slice(0, Math.min(30, shuffled.length));
}

router.get('/:type', auth, async (req,res)=>{
  const type=req.params.type; const activity=ACTIVITIES[type];
  if(!activity) return res.status(404).json({success:false,message:'Activity not found'});
  const user=await User.findById(req.user.id).select('activityLastQuestion');
  const items=pickRandomQuestions(type,activity,user);
  res.json({success:true,type,title:activity.title,reward:activity.reward,dailyLimit:activity.dailyLimit,questions:items});
});

router.post('/:type/tab-change', auth, async (req,res)=>{
  try {
    const type=req.params.type;
    if(!ACTIVITIES[type]) return res.status(404).json({success:false,message:'Activity not found'});
    const user=await User.findById(req.user.id);
    if(!user) return res.status(404).json({success:false,message:'User not found'});
    user.tabChanges=Number(user.tabChanges||0)+1;
    const current=mapGet(user.activityTabChanges,type);
    mapSet(user.activityTabChanges,type,current+1);
    await user.save();
    res.json({success:true,tabChanges:Number(user.tabChanges||0),activityTabChanges:current+1});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
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
    mapSet(user.activityCounts,type,count+1);
    mapSet(user.activityLastQuestion,type,index);
    const correctCount=mapGet(user.activityCorrect,type);
    const wrongCount=mapGet(user.activityWrong,type);
    const earned=mapGet(user.activityEarn,type);
    const deducted=mapGet(user.activityDeduct,type);
    if(correct){
      user.wallet=Number(user.wallet||0)+activity.reward;
      user.totalEarn=Number(user.totalEarn||0)+activity.reward;
      mapSet(user.activityCorrect,type,correctCount+1);
      mapSet(user.activityEarn,type,earned+activity.reward);
    }else{
      const deduction=Math.min(Number(user.wallet||0),activity.reward);
      user.wallet=Math.max(0, Number(user.wallet||0)-activity.reward);
      mapSet(user.activityWrong,type,wrongCount+1);
      mapSet(user.activityDeduct,type,deducted+deduction);
    }
    // Mystery Bonus: correct answers in any English Learning activity also count.
    const bonusToday = todayKey();
    if (user.bonusDate !== bonusToday) {
      user.bonusDate = bonusToday;
      user.bonusTarget = 70 + Math.floor(Math.random() * 31);
      user.bonusProgress = 0; user.bonusQuizProgress = 0; user.bonusLearningProgress = 0;
      user.bonusUnlocked = false; user.bonusClaimed = false; user.bonusSource = "";
      user.bonusReward = 0; user.bonusUnlockedAt = null; user.bonusClaimedAt = null;
      user.bonusLastQuestionText = ""; user.bonusLastQuestionType = "";
    }
    if (correct && !user.bonusUnlocked && !user.bonusClaimed) {
      user.bonusProgress = Number(user.bonusProgress || 0) + 1;
      user.bonusLearningProgress = Number(user.bonusLearningProgress || 0) + 1;
      user.bonusSource = "learning";
      user.bonusLastQuestionText = String(q[0] || q.prompt || q.passage || "");
      user.bonusLastQuestionType = type;
      if (user.bonusProgress >= Number(user.bonusTarget || 70)) {
        user.bonusProgress = Number(user.bonusTarget || 70);
        user.bonusUnlocked = true;
        user.bonusUnlockedAt = new Date();
      }
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
      correctCount:correct?correctCount+1:correctCount,
      wrongCount:correct?wrongCount:wrongCount+1,
      activityEarn:correct?earned+activity.reward:earned,
      activityDeduct:correct?deducted:deducted+Math.min(Number(user.wallet||0)+activity.reward,activity.reward),
      correctAnswer:expected,
      bonus: {
        target: Number(user.bonusTarget || 0),
        progress: Number(user.bonusProgress || 0),
        quizProgress: Number(user.bonusQuizProgress || 0),
        learningProgress: Number(user.bonusLearningProgress || 0),
        unlocked: !!user.bonusUnlocked,
        claimed: !!user.bonusClaimed,
        source: user.bonusSource || ""
      }
    });
  }catch(e){console.error(e);res.status(500).json({success:false,message:e.message});}
});
module.exports=router;
