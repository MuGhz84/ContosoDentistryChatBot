
var request = require('request');

class IntentRecognizer {
    constructor(config) {
        const cluIsConfigured = config && config.CLUAPIKey && config.CLUProjectName && config.CLUDeploymentName && config.CLU_StringIndexType && config.CLUPredicURL;
        if (cluIsConfigured) {
            this.isCLUConfigured = true;
            this.config = config;
        } else {
            this.isCLUConfigured = false;
        }
    }

    get isConfigured() {
        return (this.recognizer !== undefined);
    }

    /**
     * Returns an object with preformatted LUIS results for the bot's dialogs to consume.
     * @param {TurnContext} context
     */
    async executeCLUQuery(context) {
        return new Promise((resolve, reject) => {
            var CLU_ProjectName = this.config.CLUProjectName;
            var CLU_DeploymentName = this.config.CLUDeploymentName;
            var CLUPredicURL = this.config.CLUPredicURL;
            var CLU_SubscriptionKey = this.config.CLUAPIKey;
            var CLU_StringIndexType = this.config.CLU_StringIndexType;
            //var url = CLUPredicURL + "language/:analyze-conversations?api-version=2022–10–01-preview";
            var options = {
                'method': 'POST',
                'url': CLUPredicURL,
                'headers': {
                    'Ocp-Apim-Subscription-Key': CLU_SubscriptionKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "kind": "Conversation",
                    "analysisInput": {
                        "conversationItem": {
                            "id": "1",
                            "participantId": "1",
                            "text": context._activity.text
                        }
                    },
                    "parameters": {
                        "projectName": CLU_ProjectName,
                        "deploymentName": CLU_DeploymentName,
                        "stringIndexType": CLU_StringIndexType
                    }
                })
            };
            request(options, function (error, response) {
                if (error) {
                    reject(error);
                } else {
                    resolve(JSON.parse(response.body));
                }
            });
        });
    }

 
    getTimeEntity(result) {
        const datetimeEntity = result.entities.datetime;
        if (!datetimeEntity || !datetimeEntity[0]) return undefined;

        const timex = datetimeEntity[0].timex;
        if (!timex || !timex[0]) return undefined;

        const datetime = timex[0]
        return datetime;
    }
}

module.exports = IntentRecognizer