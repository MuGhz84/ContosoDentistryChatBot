// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');

//const { QnAMaker } = require('botbuilder-ai');
const { CustomQuestionAnswering } = require('botbuilder-ai');
const DentistScheduler = require('./dentistscheduler');
const IntentRecognizer = require("./intentrecognizer")

class DentaBot extends ActivityHandler {
    constructor(configuration, custquestOptions) {
        // call the parent constructor
        super();
        if (!configuration) throw new Error('[QnaMakerBot]: Missing parameter. configuration is required');

        // create a QnAMaker connector
        //this.QnAMaker = new QnAMaker()
        this.customqAnswering = new CustomQuestionAnswering(configuration.CustQuestLangConfiguration, custquestOptions);
       
        // create a DentistScheduler connector
        this.dentistScheduler = new DentistScheduler(configuration.SchedulerConfiguration);
      
        // create a IntentRecognizer connector
        this.cluintentRecognizer = new IntentRecognizer(configuration.CLUConfiguration);


        this.onMessage(async (context, next) => {

            // send user input to QnA Maker and collect the response in a variable
            const custquestResults = await this.customqAnswering.getAnswers(context);
            
          
            // send user input to IntentRecognizer and collect the response in a variable
            const cluResult = await this.cluintentRecognizer.executeCLUQuery(context);
            let intent = "";
            let entities = [];
                     
            // determine which service to respond with based on the results from LUIS //

            // if(top intent is intentA and confidence greater than 50){
            //  doSomething();
            //  await context.sendActivity();
            //  await next();
            //  return;
            // }
            // else {...}
             
            if (cluResult["result"]["prediction"]["intents"][0]["confidenceScore"] >= this.cluintentRecognizer.config.ConfidenceScoreThreshold) {
                intent = cluResult["result"]["prediction"]["topIntent"];
                entities = cluResult["result"]["prediction"]["entities"];
                console.log('intent')
                console.log(intent)
                console.log('confidenceScore')
                console.log(cluResult["result"]["prediction"]["intents"][0]["confidenceScore"])
            } else {
                intent = "None";
            }

            switch(intent) {
                case 'GetAvailability': {
                    console.log("Looking for availability")
                    if(entities.length === 0){
                        //const invaliddatetimerangevalue = "I will try to check for availability in the time range provided. However, I can't recognize the date/time you entered... ";
                        //console.log(invaliddatetimerangevalue)
                        //await context.sendActivity(invaliddatetimerangevalue);
                        const availabilities = await this.dentistScheduler.getAvailability();
                        console.log(availabilities)
                        await context.sendActivity(availabilities);
                    }
                    else{
                        const datetime = entities[0].text;
                        // call api with datetime entity info
                        const getavailabilityindatetimerange = "I'll check an available date at " + datetime;
                        console.log(getavailabilityindatetimerange)
                        await context.sendActivity(getavailabilityindatetimerange);
                        const availabilities = await this.dentistScheduler.getAvailability();
                        console.log(availabilities)
                        await context.sendActivity(availabilities);
                    }
                    
                }
                break;
                case 'ScheduleAppointment': {
                    console.log("Scheduling an Appointment")
                    if(entities.length === 0){
                        const invaliddatetimerangevalue = "I can't recognize the date/time you entered, please enter a valid date and time in format 00:00AM/PM - DD/MM/YYYY ";
                        console.log(invaliddatetimerangevalue)
                        await context.sendActivity(invaliddatetimerangevalue);
                    }
                    else{
                        const datetime = entities[0].text;
                        // call api with location entity info
                        const getScheduleAppointment = "I will schedule appointment at " + datetime;
                        console.log(getScheduleAppointment)
                        await context.sendActivity(getScheduleAppointment);
                        const responseText = await this.dentistScheduler.scheduleAppointment(datetime);
                        console.log(responseText)
                        await context.sendActivity(responseText);
                    }
                    
                }
                break;
                case 'None': {
                    // If an answer was received from QnA Maker, send the answer back to the user.
                    if (custquestResults[0]) {
                        console.log(custquestResults[0])
                        await context.sendActivity(`${custquestResults[0].answer}`);
                    }
                    else {
                        // If no answers were returned from QnA Maker, reply with help.
                        await context.sendActivity(`I'm not sure I found an answer to your question'
                        + 'You can ask me questions about our dental clinik services and dentistry in general like "how can I charge my car?"
                        + \n\n OR I can schedule an appointment with one of our dentists`);
                    }
                }
                break;
            }
            await next();
    });

        this.onMembersAdded(async (context, next) => {
        const membersAdded = context.activity.membersAdded;
        //write a custom greeting
        const welcomeText = 'Welcome to Dental-Office-Virtual-Assistant.'
        +'I can schedule your dentist appointment?. '
        +'You can say "schedule me an appointment" or "when is the next available appointment" or ask a question about our services.';
        for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
            if (membersAdded[cnt].id !== context.activity.recipient.id) {
                await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
            }
        }
        // by calling next() you ensure that the next BotHandler is run.
        await next();
    });
    }
}

module.exports.DentaBot = DentaBot;
