/////////////////////////JSON/////////////////////////
let getJSON = (url) => {
    return new Promise((resolve,reject) => {
        let xhr = new XMLHttpRequest();

        xhr.open('GET', url, true);
        
        xhr.onreadystatechange = () => {

            if(!xhr.getAllResponseHeaders().length){//якщо не вернулося ні одного хедера, реджектимо проміс
                return reject(new Error('Cross Domain Error'));
            }

            if(xhr.readyState != 4){
                return;
            }
            if(xhr.status != 200){
                let error = new Error(xhr.statusText);
                error.status = xhr.status;
                return reject(error);                
            }
            
            resolve(JSON.parse(xhr.responseText));           
        }
        xhr.send();
    })    
}
////////////////////////////////////////////////////
/////////////////////////JSONP/////////////////////
var par = document.createElement('p');
var CallbackRegistry = {};//об"єкт, в якому зберігатимуться JSONP функції при виконаннi тега <script> (при використанні JSONP)
function scriptRequest(url) {//функція для JSONP запиту, що приймає лінк до серера   
    var overwrap  = document.getElementById('overwrap');//відображатиме процес завантаження відповіді    
    overwrap.style.display = 'block';
    return new Promise(function(resolve,reject){
        var scriptOk = false;//чекатимумо чи виконання <script> було успішним чи ні
        var callbackName = 'cb' + String(Math.random()).slice(-6); //ім"я JSONP-функції, що додаватиметься до урла
        
        url += ~url.indexOf('?') ? '&' : '?'; //якщо переданий урл уже містить параметри, то ставиться &, якщо ні - ?
        url += 'callback=CallbackRegistry.' + callbackName; //додається JSONP-функція як метод CallbackRegistry об"єкта
    
        CallbackRegistry[callbackName] = function(data) { //оголошення самої JSONP-функції
            scriptOk = true;// JSONP-функція виконалася, отже сервер відповів успішно
            delete CallbackRegistry[callbackName];// видаляється, щоб не засмічувати пам"ять                    
            return resolve(data);//повертається ресолвнутий проміс
        }
        
        function checkCallback() {//функція, що перевірятиме чи успішно виконався запит. Вона використовуватиметься як хендлер для подій error і load скрипта, тобто постійно після виконання JSONP функції (при успішній відповіді)
            overwrap.style.display = 'none';//ховатиметься процес завантаження після виконнання JSONP-функції
            nav.style.display = 'block';
            if (scriptOk)return; // успішна відповідь, виходимо 
            delete CallbackRegistry[callbackName];
            var error = new Error('Bad request!');
            return reject(error);
        }  
    
        var script = document.createElement('script');
    
        script.onload = script.onerror = checkCallback;
        script.src = url;
      
        document.body.appendChild(script);
    })
    
}
//////////////////////////////////////////////////////////////////////
    var wraper = document.getElementById('wrapper');
        temperature = document.getElementById('temperature'),
        prev = document.getElementById('prev'),
        next = document.getElementById('next'),
        updateInf = document.getElementById('update-information'),
        nav = document.getElementById('nav');
    var  reverse = false;//флег, що використовуватиметься для маніпуляцій з масивом отриманих даних
    var thenHandler = function(res){//функція-хендлер, при успішному ресолві проміса
        if(reverse){
            res.results.reverse();
        }         
        var length = res.results.length;
        count = 0;
        var showInformation = function(){//функція, що заповнюватиме вибраною інформацією
            res.next?next.className = 'def':next.className = 'undef';
            res.previous || (count && !reverse) ? prev.className = 'def' : (count < length-1) && reverse 
            ? prev.className = 'def' : prev.className = 'undef';                 
            if(res.results[count].wind_speed || res.results[count].wind_direction != '--'){
                temperature.style['font-size'] = '4em';
                if(res.results[count].wind_speed){
                    var wind_speed = temperature.cloneNode(true);
                    wind_speed.innerHTML = res.report.wind_speed+' m/s';
                    wraper.insertBefore(wind_speed,updateInf);
                }
                if(res.results[count].wind_direction != '--'){
                    var wind_dir = temperature.cloneNode(true);
                    wind_dir.innerHTML = res.report.wind_dir;
                    wraper.insertBefore(wind_dir,updateInf);
                }
            }
            temperature.innerHTML = res.results[count].max_temp_fahrenheit+'<sup>o</sup>F';
            updateInf.innerHTML = 'LAST UPDATED AT '+new Date(res.results[count].terrestrial_date).toLocaleString("en-US", {month: 'long',day: 'numeric',year: 'numeric'}).toUpperCase()+' (EARTH TIME)';
        }
        if(!count){
            showInformation();//запускатиметься після повернення резолвнутого проміса при window-onload
        }
        next.onclick = function(){
            if(!reverse){//якщо масив не реверснутий то лічильник елементів масиву інкрементуємо ->
                if(count<0){
                    count = 0;
                }
                count++;
                if(count < length){//у випадку перебирання елементів масиву
                    showInformation();
                }else if(res.next){//коли елементи масиву закінчилися, то йде знову AJAX(JSONP) - запит з пропертю next в якості урла
                    reverse = false;
                    getMarsInfo(res.next.slice(0, -1));
                }
            }
            if(reverse){//-> інакше - декрементуємо               
                if(count > length){
                    count = length-1;
                }
                count--;
                if(count >= 0){
                    showInformation();
                }else if(res.next){
                    reverse = false;
                    getMarsInfo(res.next.slice(0, -1));
                }
            }            
        }
        prev.onclick = function(){
            if(!reverse){
                count--;
                if(count >= 0){
                    showInformation();
                }else if(res.previous){
                    reverse = true;
                    getMarsInfo(res.previous.slice(0, -1));
                }
            }
            if(reverse){
                count++;
                if(count < length){
                    showInformation();
                }else if(res.previous){
                    reverse = true;                 
                    getMarsInfo(res.previous.slice(0, -1));
                }
            }
        }        
    }            

    var getMarsInfo = function(url){
        getJSON(url)//якщо успішно, піде then, якщо ні - реджекнеться проміс і запуститься функція для JSONP
        .catch(function(){
            return scriptRequest(url+'p');
        })
        .then(thenHandler)
        .catch(function(err){
            alert(err);
        })
    }
    window.onload = function(){       
        nav.style.display = 'none';
        getMarsInfo('http://marsweather.ingenology.com/v1/archive/?format=json');
    }