//TODO modules/money




var demandes = [];
var stations =[];
var vaisseaux =[];

var tic ;
var conf;
var init;
window.onload = function() {



    var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create , update: update, render: render });

    var next_frame = false;
    var run_frame = false;





    

    function preload () {
        game.load.image('station', 'station.png');
        game.load.image('vaisseau','vaisseau.png');
        game.load.image('tic','tic.png');

        game.load.text('init', 'init.json');
        game.load.text('conf', 'config.json');
    }

    function create () {
        game.physics.startSystem(Phaser.Physics.ARCADE);
        tic = game.add.sprite(700,50,'tic');


        tic.inputEnabled = true;
        tic.events.onInputDown.add(function(){next_frame=true},this);

        var ticr = game.add.sprite(600,50,'tic');
        ticr.inputEnabled = true;
        ticr.events.onInputDown.add(function(){run_frame = !run_frame},this);

        



        var dataTxt=game.cache.getText('init')
        init=JSON.parse(dataTxt);
        dataTxt=game.cache.getText('conf')
        conf=JSON.parse(dataTxt);
        console.log(init);
        console.log(conf);
        //console.log(typeof conf.rien == "undefined");
        //      console.log(typeof conf.vaisseaux);



        for (var i = 0; i < init.stations.length; i++) {
            var k = init.stations[i];
            var station  = new create_station(i);
            station.sprite = game.add.sprite(k.x,k.y,'station');
            station.text = {};
            station.text.carb = game.add.text(station.x-10, station.y-10, station.carburant,{ font: "10px Arial", fill: "#ff0044", align: "center" }  );
            station.text.money = game.add.text(station.x-10, station.y-20, station.money,{ font: "10px Arial", fill: "#00FFFF", align: "center" } );                         
            station.sprite.inputEnabled = true;
            station.sprite.input.enableDrag(true);
            station.index = stations.push(station);

        }

        for (var i = 0; i < init.vaisseaux.length; i++) 
        {
            var k = init.vaisseaux[i];
            var vaisseau  = new create_vaisseau(i);
            vaisseau.sprite = game.add.sprite(stations[k.index_station].x,stations[k.index_station].y,'vaisseau')
            vaisseau.sprite.anchor.setTo(0.5, 0.5);
            vaisseau.sprite.scale.setTo(0.2, 0.2);
            

            vaisseau.index = vaisseaux.push(vaisseau);
        }

    }
    function update() {
        //console.log(demandes);
        if(next_frame||run_frame){

            for (var i = 0; i < stations.length; i++) {
                var station = stations[i];
                station.tick();
            }
            for (var i = 0; i < vaisseaux.length; i++) {
                var vaisseau = vaisseaux[i];
                vaisseau.tick();
                vaisseau.sprite.x = vaisseau.x;
                vaisseau.sprite.y = vaisseau.y;
            }
            next_frame = false;
        }
    }

    function render() {

    }
    
    
};

var demande=function(station,type,quantite,prix_achat)
{
    this.station = station;  
    this.type = type;
    this.quantite = quantite;
    this.contrat_tab = [];
    this.prix_achat = prix_achat;
};


var contrat = function(depart,prix_vente){
    this.depart = depart;
    this.prix_vente = prix_vente;   
}
var create_station = function  (index){
    this.index = index;
    this.carburant_max = conf.stations.carburant_max;
    this.carburant = init.stations[index].carburant;
    this.money = conf.stations.money;
    this.conso = conf.stations.conso;
    this.x = init.stations[index].x;
    this.y = init.stations[index].y;
    this.metal_max = conf.stations.metal_max;
    this.metal = 0;
    this.module = null;
    
    if(typeof init.stations[index].money != "undefined"){this.money = init.stations[index].money;}
    if(typeof init.stations[index].module != "undefined"){
        this.module = init.stations[index].module;
    }
    
    //console.log(typeof init.stations.module != "undefined"  );
    //console.log(init.stations[index].module);
    

     //console.log(this.carburant_max);
     this.tick = function(){
        this.checkContrats();
        this.checkRez(); 
        this.tickmodule();
        this.text.carb.text = this.carburant;
        this.text.money.text = this.money;
        this.carburant -= this.conso;
        this.money += this.conso;
    };
    this.chargerV = function(demande){
        if(this.carburant >= demande.quantite){
            this.carburant -= demande.quantite;
            return true;
        }
        return false;
    };
    this.dechargerV = function(type,qte,demande){/* prends des ressources et renvoie  je transmets la demande pour faire le paiement, on verra plus tard*/

        this.carburant += qte;
        return 0;   

    };
    this.checkContrats = function(){
        for (var i = 0; i < demandes.length; i++) {/* on regarde toutes les demandes*/
            d = demandes[i]
            /*console.log("carb "+this.carburant);*/
            if(this.carburant>this.carburant_max*0.55 && !d[this.index]){/* si la planète peut accpeter cette mission*/
                //var prix = 
                // prix d'un contrat ?

                var temp = new contrat(this);/* on ajoute un contrat de cette planète sur cette demande*/

                d.contrat_tab.push(temp);
                d[this.index] = 1;
                //console.log("on ajoute un contrat");

            }
        }
    };
    this.checkRez = function(){ 


        var carb = this.carburant+chercheDemande(this,"carburant");

        if(carb/this.carburant_max<0.4){ /* on regarde si on manque de carburant*/
            var temp = new demande(this,"carburant",5000);
            demandes.push(temp); /* dans ce cas on ajoute une demande*/
            //console.log('on ajoute une demande');
        }
    };
    this.tickmodule = function(){
        if(this.module != null){
            for (var i = 0; i < this.module.length; i++) {

                switch(this.module[i]){
                    case"carburant":
                    this.carburant+=conf.module_carburant.production;
                    break;
                    case "metal":
                    if(this.carburant>conf.module_metal.conso){
                        this.metal += conf.module_metal.production;
                        this.carburant -= conf.module_metal.conso;
                    }
                    //console.log("metal");
                    break;
                    default:
                    console.log("default @ tickmodule");

                }
            }
        }
        
    };
    this.distance = function(station){
        return distance(station.x,this.x,station.y,this.y);
    };
    return this;
};

var create_vaisseau = function(index){
    this.index = index;
    this.vitesse = conf.vaisseaux.vitesse;
    this.conso = conf.vaisseaux.conso;
    this.carburant_max=conf.vaisseaux.carburant_max;
    this.carburant = this.carburant_max;


    this.fret_max = conf.vaisseaux.fret_max;
    this.fret_actuel =0;
    this.docked = stations[init.vaisseaux[index].index_station];
    this.destination = null;
    this.fret_type = "carburant";
    this.mission = null;
    this.state = "inactif" ;/* "inactif" , "chargé" , "mission"*/
    console.log(index);
    this.x = this.docked.x;
    this.y = this.docked.y;

    this.tick = function(){
            //console.log(this.destination != undefined);
            // console.log(this.x);
            //console.log(this.y);
            if(this.state != 'inactif'){

                if(this.destination == null){
                    if(this.state == 'mission'){/* on se rends au lieu de chargement*/
                        this.charger(this.docked,this.mission.demande);
                        this.setDestination(this.mission.demande.station);
                        this.state = 'chargé';
                       // console.log("on se charge");
                   }else if(this.state == 'chargé'){/* on livre les ressources*/
                        //console.log(this.docked);
                        this.decharger(this.docked,this.mission.demande);
                        this.state = 'inactif';
                        this.mission = null;
                        /* payer le contrat :)*/
                        //console.log("déchargé");
                    }
                }else{/* on bouge vers la destination*/
                   // console.log("le vaisseau bouge")

                   var angle = this.angleto(this, this.destination);
                
                this.x = this.x- Math.cos(angle) * this.vitesse;
                this.y = this.y- Math.sin(angle) * this.vitesse;
                
                var dist =distance(this.x,this.destination.x,this.y,this.destination.y);
                
                //console.log(dist);
                if(dist<=this.vitesse){
                    //console.log("plus de destination");
                    this.docked = this.destination
                    this.destination = null;

                }

            }
        }else{/* on cherche une mission*/
            var k =choisir_mission(this);
            //console.log("mission en recherche");
            if(k != null){
                this.mission = k;
                /* on initialise la destination, ainsi que l'état*/
                this.state = "mission";
                /*console.log(k.contrat);*/
                //console.log(k.contrat.depart);
                this.setDestination(k.contrat.depart);
                
                //console.log("nouvelle mission");
            }
        }


    };
    this.angleto = function(vaisseau,station){
        var dx = vaisseau.x - station.x;
        var dy = vaisseau.y - station.y;
        //console.log(station);
        return Math.atan2(dy, dx);
    }


    this.charger = function(station,dem){
        if(station.chargerV(dem)){
            this.fret_type = dem.type;
            this.fret_actuel = dem.quantite;

        }

    };
    this.decharger = function(monde,dem){
        this.fret_actuel = monde.dechargerV(this.fret_type,this.fret_actuel,dem);


    };
    this.setDestination = function(destination){
        this.destination = destination;
        this.docked = false;
        var angle = this.angleto(this, this.destination);
        this.sprite.rotation = angle+(Math.PI/2);
        console.log(angle+(Math.PI/2));
    }

    return this;

};

function chercheDemande(station,type){
    var total = 0;
    for (var i = 0; i < demandes.length; i++) {
        var k = demandes[i];
        if(k.station ===station && k.type == type){
            total += k.quantite;
        }

    }
    for (var i = 0; i < vaisseaux.length; i++) {
        k = vaisseaux[i];
        if(k.mission != null){
            if(k.mission.demande.station === station && k.mission.demande.type == type){
                total += k.mission.demande.quantite;
            }
        }
    }
    //console.log(total);
    return total;
}

function choisir_mission(vaisseau){

    var ret = {demande:null,contrat:null};
    var removed_i = -1;
    for (var i = 0; i < demandes.length; i++) {
        var dem = demandes[i]
        var dist = 1000000;
        for (var j = 0; j < dem.contrat_tab.length; j++) {
            var ctr = dem.contrat_tab[j];
            


            var dist_totale = ctr.depart.distance({x:vaisseau.x,y:vaisseau.y})+ctr.depart.distance(dem.station);
            //console.log(dist_totale);

            
            if(dist_totale< dist){
                ret.demande=dem;
                ret.contrat=ctr;
                removed_i = i;
                dist = dist_totale;
            }
        }
    }
    if(removed_i!=-1){
        demandes.splice(removed_i-1,1);
        return ret;
    }
    return null;


};

function distance(x1,x2,y1,y2){

    var test = (x1-x2)*(x1-x2)+(y1-y2)*(y1-y2);
    //console.log((x1-x2));
    return Math.sqrt(test);
};