// Service
var api = angular
    .module('tsc')
    .service('tscApi', tscApi);

// service implementation
tscApi.$inject = ['$http','$q', '$filter']; 
function tscApi ($http, $q, $filter) {

    console.log('tscApi instanciated.');

    var mainFile = {};
    var imgurl = 'https://causa.tagesspiegel.de';
    var jsonFile = 'data/all_debates.json';

    // load the data
    getMainFile();

    function getMainFile(){
        console.log("getMainFile called");

        return $q(function(resolve, reject){

            $http.get(jsonFile)
                .then(function success(response){
                    
                    console.log('mainFile read ' + jsonFile + ' done'); 

                    mainFile = response.data;
                    resolve(mainFile);

            }, function fail(response){
                console.log('mainFile error ' + JSON.stringify(response)); 
                reject(response);
            });
        });
    }
    function filterListToArray(objlist, key, value){
        var array = [];
        for(var item in objlist){

            // skip loop if the property is from prototype
            if(!objlist.hasOwnProperty(item)) continue;

            //console.log('filterListToArray for ' + key + ':' + value + '@' + JSON.stringify(item));

            if (objlist[item][key] === value){

                var o = objlist[item];
                o["id"] = item;
                array.push(o);
            }
        }
        return array;
    }
    this.getRandomArticle = function _randomArticle(){
        return $q(function(resolve, reject){

            console.log("getRandomArticle");

            do {

                setTimeout(function(){

                    var randomId = Object.keys(mainFile.articles)[Math.floor(Math.random() * Object.keys(mainFile.articles).length)];
                    console.log("articles length " + Object.keys(mainFile.articles).length + " > random id " + randomId );
                    resolve(mainFile.articles[randomId]);            

                }, 1000);

            } while ( Object.keys(mainFile).lenght === 0 );

        });
    };


    // we assume that this is called first all time!
    this.getTopics = function _topics() {
        console.log("tscApi.getTopics");
        
        return $q(function(resolve, reject){

            do {

                setTimeout(function(){
                    resolve(mainFile.topics);
                }, 1000);

            } while ( Object.keys(mainFile).lenght === 0 );
        });
    };

    this.getDebates = function _debates(topicId) {
        console.log("tscApi.getDebates for " + topicId);

        return $q(function(resolve, reject){
            do {
                setTimeout(function(){

                    var da = mainFile.debates;
                    for (var d in da){
                        da[d]["topic_title"] = mainFile.topics[da[d].topic]["title"];
                        //console.log(JSON.stringify(da[d]));
                    }

                    if (topicId === undefined){
                        console.log("tscApi.getDebates all");
                        resolve(da);
                    } else {
                        console.log("tscApi.getDebates for topic: " + topicId);
                        resolve(filterListToArray(da, "topic", topicId));
                    }
                }, 1000);

            } while ( Object.keys(mainFile).lenght === 0 );
        });
    };
    /* not used - was useful previously
    this.getDebate = function _debate(debateId) {
        console.log("tscApi.getDebate for " + debateId);

        return $q(function(resolve, reject){                
                resolve(this.getDebates()[debateId]);
        });
    };*/

    this.getArticlesOfDebate = function _articlesOfDebate(debateId) {
        console.log("tscApi.getArticlesOfDebate");

        return $q(function(resolve, reject){

            var vA = filterListToArray(mainFile.articles, "debate", debateId);

            /* replace data-id by id for anchor scrolling and add mouse over 
               - be aware that a modified ngSanitize is used, bcz not all attributes are allowed and filtered by default 
               - id and ng.mouseenter was manually added to angular-sanitize.min.js
               there should be a better way by avoiding embedded html
            */
            for(var k in vA){
                vA[k].text = vA[k].text.replace(/data-id/gi, "id");
                vA[k].text = vA[k].text.replace(/class=/gi, "ng-click=vm.showAlert() ng-mouseenter=vm.paintArticleIndicator($event) class=");
                vA[k].text = $sce.trustAsHtml(vA[k].text);
                vA[k]["theses"] = filterListToArray(mainFile.articles_theses, "article", k); 
            }

            resolve(vA);   
        });
    };

    this.getVotesDataOfDebate = function _voteDataOfDebate(debateId){
        console.log("tscApi.getVotesDataOfDebate");

        return $q(function(resolve, reject){ 

            var data = [];

            var votesOfDebate = filterListToArray(mainFile.votes, "debate", debateId);

            // get list of all thesis
            var listOfTheses = [];
            for(var thesis in votesOfDebate) {
                
                if (listOfTheses.indexOf(votesOfDebate[thesis]["thesis"])<0){
                    //console.log("tscApi.getVotesDataOfDebate.listOfTheses new " + votesOfDebate[thesis]["thesis"]);
                    listOfTheses.push(votesOfDebate[thesis]["thesis"]);
                }

            }

            // build the array
            for(var t in listOfTheses){
                var v = filterListToArray(votesOfDebate, "thesis", listOfTheses[t]);
                var sum = 0;

                for(var v2 in v){
                   sum = sum+ parseInt(v[v2]["vote"]);
                }

                data.push([v.length, sum]);
            }
            

            resolve(data);    
        });
    };

   /* this.getArticlesOfAuthor = function _articlesOfAuthor(authorId) {
        console.log("tscApi.getArticles");

        return $q(function(resolve, reject){ 
 
            var articles = filterListToArray(mainFile.articles, "author", authorId);

            resolve(articles);
 
        });
    };*/
    /*this.getArticle = function _article(articleId) {
        console.log("tscApi.getArticle for " + articleId);

        return $q(function(resolve, reject){ 
 
            var article = mainFile.articles[articleId]

            resolve(article);
        });
    };*/


    this.getAuthors = function _authors(){

        console.log("tscApi.getAuthors");

        return $q(function(resolve, reject){ 
            if (mainFile.length === 0){
                getMainFile().then(function success(response){

                        var authors = mainFile.authors;

                        for(var a in authors){

                            // update pic
                            authors[a].images.portrait = 'https://causa.tagesspiegel.de'+authors[a].images.portrait;

                            // org
                            if (authors[a].organisation !== undefined){
                                console.log("org id: " + authors[a].organisation);
                                authors[a].organisation = mainFile.organisations[authors[a].organisation].name;
                            }

                            authors[a]["theses"] = filterListToArray(mainFile.theses, "created_by", a);
                            authors[a]["articles"] = filterListToArray(mainFile.articles, "author", a);
                            authors[a]["votes"] = filterListToArray(mainFile.votes, "author", a);

                            for (var i = 0; i < authors[a].votes.length; i++) {
                                authors[a].votes[i]["thesis_text"] = mainFile.theses[authors[a].votes[i].thesis].text;   
                            }

                        }

                        resolve(authors);
                    });            
            } else {
                resolve(mainFile.authors);
            }
        });
    };

    this.getAuthor = function _author(authorId){
        return $q(function(resolve, reject){
            getAuthors().then(function success(response){
              resolve(response.authorId);
          });
        });
    };

    this.getAuthorsProVote = function _proVoteAuthors(thesisId){

    };

    this.getAuthorsConVote = function _conVoteAuthors(thesisId){

    };
}



