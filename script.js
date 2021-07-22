//require request and cheerio
let request=require("request");
let cheerio=require("cheerio");
const {jsPDF}=require('jspdf');
let fs=require("fs");
//make object of cheerio
let $;
let data={};
//call back function
//error-if error occurs
//response of the request
//html of the web page
function LinkGenerator(error,response,body){
    if(!error&&response.statusCode==200){
        //loaded in the object
        $=cheerio.load(body);
        //sorted on the basis of css selector
        let allTopics=$(".no-underline.d-flex.flex-column.flex-justify-center");
        let allTopicsNames=$(".f3.lh-condensed.text-center.Link--primary.mb-0.mt-1")
        //loop on the array
        for(let x=0;x<3;x++){
            getTopicName(($(allTopicsNames[x]).text().trim()),
            ("https://github.com"+$(allTopics[x]).attr("href")));
        }
    }
}
//getting the project name of the topic
function getTopicName(name,url){
    
    request(url,function (error,response,body){
        if(!error&&response.statusCode==200){
            $=cheerio.load(body);
            let allProjects=$(".f3.color-text-secondary.text-normal.lh-condensed .text-bold");
            //to check the no of projects and decreasing the no to 8 in case of more
            if(allProjects.length>8){
                allProjects=allProjects.slice(0,8);
            }
            for(let x=0;x<allProjects.length;x++){
                //getting project title and url
                let projectTitle=$(allProjects[x]).text().trim();
                let projectLinks="https://github.com/"+$(allProjects[x]).attr("href");
                //if the project does not exist make an array and add it
            if(!data[name]){
                data[name]=[{name:projectTitle,link:projectLinks}];
            }
            else{
                //in case if the project exists
                data[name].push({name:projectTitle,link:projectLinks})
            }
            getIssuesPage(projectTitle,name,projectLinks);
            }

        }
    })
    
}
//getting the issues of the project
function getIssuesPage(projectName,topicName,url){
    request(url+"/issues",function(error,response,body){
        if(!error){
            $=cheerio.load(body);
            //loading all the issues
            let allIssues=$(".Link--primary.v-align-middle.no-underline.h4.js-navigation-open");
            for(let i=0;i<allIssues.length;i++){
                //getting issue name and url
                let IssuesName=$(allIssues[i]).text().trim();
                let IssueLink="https://github.com/"+$(allIssues[i]).attr("href");
                let index=-1;
                for(let i=0;i<data[topicName].length;i++){
                    //if the project exists saving its index
                    if(data[topicName][i].name===projectName){
                        index=i;
                        break;
                    }
                }
                //setting the data
                if(!data[topicName][index].issues){
                    data[topicName][index].issues=[{IssuesName,IssueLink}]
                }
                else{
                    data[topicName][index].issues.push({IssuesName,IssueLink})
                }
            }
            //writing the data to json file
            fs.writeFileSync("data.json",JSON.stringify(data));
            pdfGenerator(data);
        }
    })
}
function pdfGenerator(data){
    //project title
    for(x in data){
        //making folder
        if(!fs.existsSync(x)) fs.mkdirSync(x)
        let path="./"+x+"/"
        //project topics
        for(y in data[x]){
            //new pdf
            const doc=new jsPDF();
            let issuesArr=data[x][y].issues;
            let spacing=0;
            //issues of topics
            for(z in issuesArr){
                //writing in pdf
                doc.text(issuesArr[z].IssuesName,10,10+spacing);
                spacing+=10;
                doc.text(issuesArr[z].IssueLink,10,10+spacing)
                spacing+=10;
            }
            //if file exist delete it
            if(fs.existsSync(path+data[x][y].name+".pdf")){
                fs.unlinkSync(path+data[x][y].name+".pdf")}
            //savng the pdf
            doc.save(path+data[x][y].name+".pdf");
        }
    }
}
//requesting the webpage
request("https://github.com/topics",LinkGenerator)