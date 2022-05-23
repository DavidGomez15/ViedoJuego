var time = new Date();
var deltaTime = 0;

if(document.readyState === "complete" || document.readyState === "interactive"){
    setTimeout(Init, 1);
}else{
    document.addEventListener("DOMContentLoaded", Init);  //SE DEFINE EL AREA QUE SE VA A TRABAJAR
}

function Init() {   //   CON ESTO INICIAMOS EL BUCLE DEL JUEGO/ INICIAN EL JUEGO CUANDO TODAS LAS IMAGENES SE CARGAN/ Y SE PROGRAMA UPDATE PARA LLAMARSE VARIAS VECES POR SEGUNDO
    time = new Date();
    Start();
    Loop();
}

function Loop() {
    deltaTime = (new Date() - time) / 1000;
    time = new Date();
    Update();
    requestAnimationFrame(Loop);
}

//****** logica del juego ********//

var nivelDelMar = 100;                  //PROPIEDADES DEL JUEGO/SE INICIALIZAN TODAS LAS VARIABLES POR CADA OBJETO A UTILIZARSE
var nivelDelMarCubriendo = 60;
var velY = 0;
var impulso = 900;
var impulsoEnAgua = 500;
var gravedad = 2500;
var densidad = 0.00035;
var coeficienteRozamiento = 0.01;

var dinoPosX = 42;
var dinoPosY = nivelDelMar; 

var sueloX = 0;
var velEscenario = 1280/3;
var gameVel = 1;
var score = 0;

var parado = false;
var saltando = false;

var tiempoHastaMoneda = 2;
var tiempoMonedaMin = 0.3;
var tiempoMonedaMax = 1.8;
var monedaMinY = 5;
var monedaMaxY = 320;

var tiempoHastaObstaculo = 2;
var tiempoObstaculoMin = 0.7;
var tiempoObstaculoMax = 1.8;

var interactuables = [];

var tiempoHastaNube = 0.5;
var tiempoNubeMin = 0.7;
var tiempoNubeMax = 2.7;
var maxNubeY = 320;
var minNubeY = 160;
var nubes = [];
var velNube = 0.5;

var contenedor;
var dino;
var textoScore;
var suelo;
var gameOver;
var audioMoneda;
var audioSalto;
var audioGameOver;

function Start() {
    gameOver = document.querySelector(".game-over");       //LUEGO SE SETEAN, SE PREPARAN PARA SR UTILIZADAS 
    suelo = document.querySelector(".suelo");
    contenedor = document.querySelector(".contenedor");
    textoScore = document.querySelector(".score");
    dino = document.querySelector(".dino");
    audioMoneda = document.querySelector(".audio-moneda");
    audioSalto = document.querySelector(".audio-salto");
    audioGameOver = document.querySelector(".audio-gameOver");
    document.addEventListener("keydown", HandleKeyDown);
}

function Update() {  
    if(parado) return; //LLAMAMOS A LA FUNCION UPDATE QUIEN ES LA ENCARGADA DE LOS MOVIMIENTOS DEL DINO Y DE TODOS LOS OBSTACULOS Y OBJETOS DEL ENTORNO
    
    MoverDinosaurio();
    MoverSuelo();
    DecidirCrearMonedas();
    DecidirCrearObstaculos();
    DecidirCrearNubes();
    MoverInteractuables();
    MoverNubes();
    DetectarColision();

    if(dinoPosY >= nivelDelMar) { //DENTRO DEL AGUA, ESTO HARA QUE SE LE CONYTRARESTRE A LA GRAVEDAD LA FUERZA DE EMPUJE Y MANTENDRA A FLOTE AL REX 

        velY -= gravedad * deltaTime;
    }else{
        var empuje = VolumenSumergido() * densidad * gravedad;
        var rozamiento = Math.sign(velY) * velY * velY * coeficienteRozamiento;
        velY += (empuje - rozamiento - gravedad) * deltaTime;
    }
}

function VolumenSumergido() {
    if(dinoPosY >= nivelDelMar) { //FUERA DEL AGUA
        return 0;
    }else {
        return dino.clientWidth * Math.min(nivelDelMar - dinoPosY, dino.clientHeight);
    }
}

function HandleKeyDown(ev){
    if(ev.keyCode == 32){
        Saltar();
    }
}

function Saltar(){ //SI EL DINO ESTA CUBIERTO POR EL AGUA, SALTARA MENOS, SI ESTA A FLOTE EL SALTO SERA MAYOR
    if(!saltando){
        saltando = true;
        dino.classList.remove("dino-corriendo");
        audioSalto.currentTime = 0;
        audioSalto.play();
        if(dinoPosY > nivelDelMarCubriendo){
            velY = impulso;
        }else{
            velY = impulsoEnAgua;
        }
    }
}

function MoverDinosaurio() {
    if(dinoPosY < nivelDelMarCubriendo){  //ACA DETECTAMOS SI EL DINOSAURIO ESTA TOCANDO EL AGUA
        TocarSuelo();
    }
    dinoPosY += velY * deltaTime;
    dino.style.bottom = dinoPosY+"px";
}

function TocarSuelo() { //ACA DETECTAMOS SI EL DINOSAURIO ESTA TOCANDO EL AGUA
    if(saltando){
        dino.classList.add("dino-corriendo");
    }
    saltando = false;
}

function MoverSuelo() { //CON ESTA FUNCION MOVELOS LAS OLAS, AL MISMO TIEMPO QUE EL PERSONAJE
    sueloX += CalcularDesplazamiento();
    suelo.style.left = -(sueloX % contenedor.clientWidth) + "px";
}

function CalcularDesplazamiento() {
    return velEscenario * deltaTime * gameVel;
}

function Estrellarse() { //ESTA FUNCION ES LA QUE DETECTA SI NOS ESTRELLAMOS Y AVISA QUE MUESTREN EL MENSAJE
    dino.classList.remove("dino-corriendo");
    dino.classList.add("dino-estrellado");
    parado = true;
}

function DecidirCrearObstaculos() { //CREA OBSTACULOS NUEVOS, MAS ABAJO EN OTRA FUNCION SE OBTIENE LA FORMA PARA UBICARSEN 
    tiempoHastaObstaculo -= deltaTime;
    if(tiempoHastaObstaculo <= 0) {
        CrearObstaculo();
    }
}

function DecidirCrearMonedas() {//CREA NUEVAS MONEDAS 
    tiempoHastaMoneda -= deltaTime;
    if(tiempoHastaMoneda <= 0) {
        CrearMoneda();
    }
}

function DecidirCrearNubes() {//CREA NUEVAS NUBES
    tiempoHastaNube -= deltaTime;
    if(tiempoHastaNube <= 0) {
        CrearNube();
    }
}

function CrearMoneda() {  //CREAMOS LAS MONEDAS LAS CUALES APARECEN DE MANERA ALEATORIA TAMBIEN Y EN DISTINTAS POSICIONES, CON ESTAS GANAMOS PUNTOS
    var moneda = document.createElement("div");
    contenedor.appendChild(moneda);
    moneda.classList.add("moneda");
    moneda.posX = contenedor.clientWidth;
    moneda.style.left = contenedor.clientWidth+"px";
    moneda.style.bottom = monedaMinY + (monedaMaxY - monedaMinY) * Math.random() + "px";

    interactuables.push(moneda);
    tiempoHastaMoneda = tiempoMonedaMin + Math.random() * (tiempoMonedaMax-tiempoMonedaMin) / gameVel;
}

function CrearObstaculo() {
    var obstaculo = document.createElement("div");  //ACA CREAMOS OBSTACULOS Y SE PONE ALEATORIO PARA PONER UNOS OBSTACULOS A FLOTE Y OTROS BAJO EL AGUA
    contenedor.appendChild(obstaculo);
    obstaculo.classList.add("obstaculo");
    obstaculo.posX = contenedor.clientWidth;
    obstaculo.style.left = contenedor.clientWidth+"px";

    if(Math.random() > 0.5){
        obstaculo.classList.add("obstaculo-flotante");
    }else{
        obstaculo.classList.add("obstaculo-hundido");
    }

    interactuables.push(obstaculo);
    tiempoHastaObstaculo = tiempoObstaculoMin + Math.random() * (tiempoObstaculoMax-tiempoObstaculoMin) / gameVel;
}

function CrearNube() {  //DE MANERA ALEATORIA COMO LAS MONEDAS Y LOS OBSTACULOS, TAMBIEN SE GENERAN NUBES EN DISTINTAS ALTURAS Y POSICIONES CADA CIERTO TIEMPO
    var nube = document.createElement("div");
    contenedor.appendChild(nube);
    nube.classList.add("nube");
    nube.posX = contenedor.clientWidth;
    nube.style.left = contenedor.clientWidth+"px";
    nube.style.bottom = minNubeY + Math.random() * (maxNubeY-minNubeY)+"px";
    
    nubes.push(nube);
    tiempoHastaNube = tiempoNubeMin + Math.random() * (tiempoNubeMax-tiempoNubeMin) / gameVel;
}

function MoverInteractuables() { //ESTA FUNCION PERMITE QUE LAS OLAS, EL DINO, LOS OBJETOS Y TODO LO INTERACTUABLE PUEDA MOVERSE, SIN ESTA FUNCION ESTARIA TODO ESTATICO
    for (var i = interactuables.length - 1; i >= 0; i--) {
        if(interactuables[i].posX < -interactuables[i].clientWidth) {
            interactuables[i].parentNode.removeChild(interactuables[i]);
            interactuables.splice(i, 1);
        }else{
            interactuables[i].posX -= CalcularDesplazamiento();
            interactuables[i].style.left = interactuables[i].posX+"px";
        }
    }
}

function MoverNubes() { //ACA SE MUEVEN LAS NUBES, EN LA FUNCION CREARNUBE SE GENERAN Y ACA LAS MUEVE POR TODO EL CANVA
    for (var i = nubes.length - 1; i >= 0; i--) {
        if(nubes[i].posX < -nubes[i].clientWidth) {
            nubes[i].parentNode.removeChild(nubes[i]);
            nubes.splice(i, 1);
        }else{
            nubes[i].posX -= CalcularDesplazamiento() * velNube;
            nubes[i].style.left = nubes[i].posX+"px";
        }
    }
}

function GanarPuntos() { //SE INCREMENTA UN PUNTO CADA QUE COLISIONA CON UNA MONEDA
    score++;
    textoScore.innerText = score;
    audioMoneda.currentTime = 0; //SE AGREGA EL AUDIO POR AGARRAR LA MONEDA
    audioMoneda.play();
    if(score == 10){
        gameVel = 1.2;
        contenedor.classList.add("mediodia"); //SE CAMBIA LA VELOCIDAD CON LA CUAL LAS MONEDAS CORREN 
    }else if(score == 25) {
        gameVel = 1.4;
        contenedor.classList.add("tarde");
    } else if(score == 50) {
        gameVel = 1.7;
        contenedor.classList.add("noche");
    }
    suelo.style.animationDuration = (3/gameVel)+"s";
}

function GameOver() { //SI HAY UNA COLISION SE MUESTRA ESTA ALERTA
    Estrellarse();
    gameOver.style.display = "block";
    audioGameOver.play();
}

function DetectarColision() {  //CON ESTA FUNCION DETECTAMOS SI EL DINO SE CHOCA CON ALGUN OBSTACULO Y TOCA COMPARAR CON QUE SE CHOCO, SI ES UN OBSTACULO APAREZCA JUEGO PERDIDO Y SI ES UNA MONEDA SUME UN PUNTO
    for (var i = 0; i < interactuables.length; i++) {
        
        if(interactuables[i].posX > dinoPosX + dino.clientWidth) {
            
            break; 
        }else{
            if(IsCollision(dino, interactuables[i], 10, 25, 10, 20)) {
                if(interactuables[i].classList.contains("moneda")){
                    GanarPuntos();
                    interactuables[i].parentNode.removeChild(interactuables[i]);
                    interactuables.splice(i, 1); //SI ES MONEDA SE ELIMINA PARA NO VOLVER A CHOCARSE Y SUMAR DOBLE PUNTO SOLO CON UNA MONEDA
                }else{
                    GameOver();
                }
            }
        }
    }
}

function IsCollision(a, b, paddingTop, paddingRight, paddingBottom, paddingLeft) { //EN ESTA FUNCION SE DETECTA SI SE CHOCAN AMBOS, EL DINO Y EL OBSTACULO
    var aRect = a.getBoundingClientRect();
    var bRect = b.getBoundingClientRect();

    return !(
        ((aRect.top + aRect.height - paddingBottom) < (bRect.top)) ||
        (aRect.top + paddingTop > (bRect.top + bRect.height)) ||
        ((aRect.left + aRect.width - paddingRight) < bRect.left) ||
        (aRect.left + paddingLeft > (bRect.left + bRect.width))
    );
}
