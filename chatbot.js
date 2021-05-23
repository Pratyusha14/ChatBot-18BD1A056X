const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const { Payload } =require("dialogflow-fulfillment");
//const {dialogflow, SimpleResponse} = require('actions-on-google');
const app = express();

const MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var randomstring = require("randomstring"); 
var user_name="";

app.post("/dialogflow", express.json(), (req, res) => {
	console.log("connected");
    const agent = new WebhookClient({ 
		request: req, response: res 
		});


async function identify_user(agent)
{
  console.log("hi");
  const PhoneNumber = agent.parameters.PhoneNumber;
  const client = new MongoClient(url);
  console.log("connected");
  await client.connect();
  const snap = await client.db("chatbot").collection("user_table").findOne({"PhoneNumber": PhoneNumber});
  console.log(snap);
  if(snap==null){
	  await agent.add("Re-Enter your PhoneNumber");

  }
  else
  {
	
  user_name=snap.user_name;
  await agent.add("Welcome  "+user_name+"!!  \n How can I help you");}
}
	
function report_issue(agent)
{
 
  var issue_vals={1:"Internet Down",2:"Slow Internet",3:"Buffering problem",4:"No connectivity"};
  
  const intent_val=agent.parameters.issue_num;
  
  var val=issue_vals[intent_val];
  
  var trouble_ticket=randomstring.generate(7);

  //Generating trouble ticket and storing it in Mongodb
  //Using random module
  MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("chatbot");
    
	var u_name = user_name;    
    var issue_val=  val; 
    var status="pending";

	let ts = Date.now();
    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();

    var time_date=year + "-" + month + "-" + date;

	var myobj = { username:u_name, issue:issue_val,status:status,time_date:time_date,trouble_ticket:trouble_ticket };

    dbo.collection("user_issues").insertOne(myobj, function(err, res) {
    if (err) throw err;
    db.close();    
  });
 });
 agent.add("The issue reported is: "+ val +"\nThe ticket number is: "+trouble_ticket);
}

//trying to load rich response
function custom_payload(agent)
{
	var payLoadData="Enter 1 for InternetDown \n Enter 2 for Slow Internet \n Enter 3 for Buffering problem \n Enter 4 for No connectivity";
agent.add(payLoadData);
}




var intentMap = new Map();
intentMap.set("service_intent", identify_user);
intentMap.set("service_intent - custom - custom", report_issue);
intentMap.set("service_intent - custom", custom_payload);

agent.handleRequest(intentMap);

});//Closing tag of app.post

app.listen(process.env.PORT || 8080);