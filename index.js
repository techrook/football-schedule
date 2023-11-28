import { Web5 } from "@web5/api";

//Node 18 users: the following 3 lines are needed
import { webcrypto } from "node:crypto";
// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;



const { web5, did: userDid } = await Web5.connect();

const schema = {
    context: "https://schema.org/",
    type: "SportsEvent",
    get uri() {
      return this.context + this.type;
    },
  };

  // Soccer Match Schedule
let matches = [
    {
      "@context": schema.context,
      "@type": schema.type,
      name: "Soccer Match 1",
      startDate: "2023-11-30T19:00:00",
      location: {
        "@type": "Place",
        name: "Stadium 1",
        address: {
          "@type": "PostalAddress",
          streetAddress: "123 Main Street",
          addressLocality: "City 1",
          addressRegion: "State 1",
        },
      },
      competitor: [
        {
          "@type": "SportsTeam",
          name: "Home Team A",
        },
        {
          "@type": "SportsTeam",
          name: "Away Team B",
        },
      ],
    },
    {
      "@context": schema.context,
      "@type": schema.type,
      name: "Soccer Match 2",
      startDate: "2023-12-05T20:00:00",
      location: {
        "@type": "Place",
        name: "Stadium 2",
        address: {
          "@type": "PostalAddress",
          streetAddress: "456 Main Street",
          addressLocality: "City 2",
          addressRegion: "State 2",
        },
      },
      competitor: [
        {
          "@type": "SportsTeam",
          name: "Home Team C",
        },
        {
          "@type": "SportsTeam",
          name: "Away Team D",
        },
      ],
    },
    
  ];

  //Query for all the matches to be played. (search for DWN records)
  async function getMatches(){
    let {records} = await web5.dwn.records.query({
        message: {
            filter: {
              schema: schema.uri,
            },
          },
          dateSort: "createdAscending",
    });
    return records;
  }


//Create match schedule (write record to DWN)
async function addNewGameShedule(){
    for (const match of matches){
        const response = await web5.dwn.records.create({
            data: match,
            message: {
              schema: schema.uri,
              dataFormat: "application/json",
              published: true,
            },
          });

          if (response.status.code === 202) {
            console.log(`${match.competitor[0].name} plays ${match.competitor[1].name} at Home ${match.location.name} on ${match.startDate} `)
          }else {
            console.log(`${response.status}. Error adding match  to shedule for  ${match.name}`);
          }
    }
    // existingMatchReview = await getMatches();
}

//Update match time 
async function updateMatchTime(match, newTime){
  let matchData = await match.data.json();
  console.log(`old match time for ${matchData.name}`, matchData.startDate);

  matchData.startDate = newTime
  let response = await match.update({
    data: matchData
});


if (response.status.code === 202) {
  //Obtain the updated record
  const { record: updatedMatchTime } = await web5.dwn.records.read({
    message: {
      filter: {
        recordId: match.id
      }
    }
  });

  const updatedData = await updatedMatchTime.data.json();
  console.log(`updated match time for ${matchData.name}`, updatedData.startDate);
} 
else console.log(`${response.status}. Error updating match time for ${matchData.name}`);
}

//Delete all games shedule
async function deletematches() {
  let matches = await getMatches();

  for (const match of matches) {
    let name = (await match.data.json()).name;
    let response = await web5.dwn.records.delete({
      message: {
        recordId: match.id,
      },
    });
    console.log(`deleted ${name}. status: ${response.status.code}`);
  }
}

let existingMatchReview = await getMatches();
await addNewGameShedule();
await updateMatchTime(existingMatchReview[0],"2023-11-30T17:00:00");
await deletematches();
process.exit();