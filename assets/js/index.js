const contractSource = `
contract Gamify =

  record game = {
    id:int,
    name: string,
    price:int,
    purchased:bool,
    description : string,
    images:string,
    owner:address
    
    }
  
  
  record state = 
    {
      gameLength : int,
      games : map(int, game)
    }
  
  entrypoint init() = 
    { games = {}, 
      gameLength = 0}
  
    
  entrypoint getGameLength() : int = 
    state.gameLength
  
  stateful entrypoint addGame(_name:string, _price:int, _images:string, _description : string ) =
    let game = {id=getGameLength() + 1, name=_name, price=_price, description = _description, images=_images,purchased=false, owner=Call.caller}
    let index = getGameLength() + 1
    put(state{games[index] = game, gameLength  = index})

  
  entrypoint get_game_by_index(index:int) : game = 
    switch(Map.lookup(index, state.games))
      None => abort("Game does not exist with this index")
      Some(x) => x  
  
  payable stateful entrypoint buyGame(_id:int)=
    let game = get_game_by_index(_id) // get the current game with the id
    
    let  _seller  = game.owner : address
    
    require(game.id > 0,abort("NOT A GAME ID"))
    
    // require that there is enough AE in the transaction
    require(Call.value >= game.price,abort("You Don't Have Enough AE"))
    
    // require that the game has not been purchased
    
    require(!game.purchased,abort("GAME ALREADY PURCHASED"))
    
    // require that the buyer is not the seller
    
    require(_seller != Call.caller,"SELLER CAN'T PURCHASE HIS ITEM")
    
    // transfer ownership
    
    //game.owner = Call.caller
    
    // mark as  purchased
    
    //game.purchased = true 
    
    // update the game
    let updated_game = {id=game.id, name=game.name, price=game.price, images=game.images, description = game.description, purchased = true, owner=Call.caller}
    
    put(state{games[_id] = updated_game})
    
    // sends the amount
    
    Chain.spend(_seller, Call.value)
 
    `; 
    
    


const contractAddress = 'ct_oBWZxezUbHRWBBeLKB2LR59ms8rLu2NGhX7mCDWqA94SW8DE1';
var GameArray = [];
var client = null;
var gameLength = 0;

function createAlert(title, summary, details, severity, dismissible, autoDismiss, appendToId) {
  var iconMap = {
    info: "fa fa-info-circle",
    success: "fa fa-thumbs-up",
    warning: "fa fa-exclamation-triangle",
    danger: "fa ffa fa-exclamation-circle"
  };

  var iconAdded = false;

  var alertClasses = ["alert", "animated", "flipInX"];
  alertClasses.push("alert-" + severity.toLowerCase());

  if (dismissible) {
    alertClasses.push("alert-dismissible");
  }

  var msgIcon = $("<i />", {
    "class": iconMap[severity] // you need to quote "class" since it's a reserved keyword
  });

  var msg = $("<div />", {
    "class": alertClasses.join(" ") // you need to quote "class" since it's a reserved keyword
  });

  if (title) {
    var msgTitle = $("<h4 />", {
      html: title
    }).appendTo(msg);
    
    if(!iconAdded){
      msgTitle.prepend(msgIcon);
      iconAdded = true;
    }
  }

  if (summary) {
    var msgSummary = $("<strong />", {
      html: summary
    }).appendTo(msg);
    
    if(!iconAdded){
      msgSummary.prepend(msgIcon);
      iconAdded = true;
    }
  }

  if (details) {
    var msgDetails = $("<p />", {
      html: details
    }).appendTo(msg);
    
    if(!iconAdded){
      msgDetails.prepend(msgIcon);
      iconAdded = true;
    }
  }
  

  if (dismissible) {
    var msgClose = $("<span />", {
      "class": "close", // you need to quote "class" since it's a reserved keyword
      "data-dismiss": "alert",
      html: "<i class='fa fa-times-circle'></i>"
    }).appendTo(msg);
  }
  
  $('#' + appendToId).prepend(msg);
  
  if(autoDismiss){
    setTimeout(function(){
      msg.addClass("flipOutX");
      setTimeout(function(){
        msg.remove();
      },1000);
    }, 5000);
  }
}





function renderProduct()
{
    GameArray = GameArray.sort(function(a,b){return b.Price - a.Price})
    var template = $('#template').html();
    
    Mustache.parse(template);
    var rendered = Mustache.render(template, {GameArray});

    
  

    $('#body').html(rendered);
    console.log("for loop reached")
}
//Create a asynchronous read call for our smart contract
async function callStatic(func, args) {
  //Create a new contract instance that we can interact with
  const contract = await client.getContractInstance(contractSource, {contractAddress});
  //Make a call to get data of smart contract func, with specefied arguments
  console.log("Contract : ", contract)
  const calledGet = await contract.call(func, args, {callStatic: true}).catch(e => createAlert('','',e,'warning',false,true,'pageMessages'));
  //Make another call to decode the data received in first call
  console.log("Called get found: ",  calledGet)
  const decodedGet = await calledGet.decode().catch(e => window.alert(e));
  console.log("catching errors : ", decodedGet)
  return decodedGet;
}

async function contractCall(func, args, value) {
  const contract = await client.getContractInstance(contractSource, {contractAddress});
  //Make a call to write smart contract func, with aeon value input
  const calledSet = await contract.call(func, args, {amount:value}).catch(e => createAlert('','',e,'warning',false,true,'pageMessages'));

  return calledSet;
}

window.addEventListener('load', async () => {
  $("#loadings").show();

  client = await Ae.Aepp()

  gameLength = await callStatic('getGameLength', []); 

  for(let i = 1; i<= gameLength ; i++ ){
    const games =  await callStatic('get_game_by_index', [i]);
    
    console.log("for loop reached", "pushing to array")
    console.log(games.images)
    console.log(games.name)
    console.log(games.price)

   

    GameArray.push({
        id : games.id,
        imageUrl : games.images,
        name : games.name, 
        price : games.price,
        purchased : games.purchased
        

     
  })
}
  renderProduct();
  $("#loadings").hide();
});



$('#regButton').click(async function(){
  $("#loadings").show();

    var name =($('#name').val()),
    
    url = ($('#imageUrl').val()),
   
    price = ($('#price').val());

    description = ($('#description').val());
    prices = parseInt(price,10)
    await contractCall('addGame', [name,prices,url,description], prices)
   
    console.log(url)
    console.log(name)
    console.log(prices)
    console.log(typeof(prices))
   

    
    GameArray.push({
        id : GameArray.length + 1,
        name : name,
        url : url,
        price : prices,
        description : description

        
        
    })
    renderProduct();
    $("#loadings").hide();
});

$("#body").click(".btn-2", async function(event){
  $("#loadings").show();
    console.log("Button has been clicked")

    // await contractCall('buyGame', [], prices)s
   
    const dataIndex = event.target.id
    const gamePrice = GameArray[dataIndex].price
    const gameid =  GameArray[dataIndex].id
    console.log("Price of product",gamePrice)
    await contractCall('buyGame', [dataIndex],parseInt(gamePrice, 10)).catch((e) =>{
      const message = createAlert('','',e,'warning',false,true,'pageMessages');
      const messageId = document.getElementById("message");
      messageId.innerHTML = message
    });
  // sold = purchased_game.purchased 
    // GameArray.push({
    //   purchased : p
      

    // })
  
  // const foundIndex = productListArr.findIndex(product => product.id === dataIndex)
  // const value = $(".buyBtn")[foundIndex] ;

    console.log("-----------------")
    console.log("Data Index:", dataIndex)
    console.log("--------------------------")
  
    console.log("Just Clicked The Buy Button")

    

    


    
    renderProduct();
    $("#loadings").hide();
});