
async function getArrivals(stopId){
  const url= `https://v6.db.transport.rest/stops/${stopId}/arrivals?duration=60`;
  const response = await fetch(url);
  const arrivals = await response.json();
  console.log(arrivals);
  return arrivals;
}

async function getDepartures(stopId){
  const url= `https://v6.db.transport.rest/stops/${stopId}/departures?duration=60`;
  const response = await fetch(url);
  const departures = await response.json();
  console.log(departures);
  return departures;
}

async function getMissedConnctions(stopId, transferTime=600){
	let stats = {arrivals:0,onTimeCount:0, lateCount:0,missedConnections:0,atRisk:0,details:[],raw:{}};

	//getArrivals
	const arrivalsJson = await getArrivals(stopId);
	const arrivals = arrivalsJson.arrivals;
	//see what the connection times would be missed

	//getDepartures
	const departuresJson = await getDepartures(stopId);
	const departures = departuresJson.departures;
	
	arrivals.forEach(arrival => {
		//only check if delayed
		stats.arrivals+=1;
		if(arrival.delay > 0){	
			stats.lateCount+=1;
			stats.details.push(`${arrival.plannedWhen} from ${arrival.provenance} ${arrival.delay/60} minutes late`);
			// see if the delay would potentially make for a missed valid connection
			departures.forEach(departure=>{
				//look for valid connections
				let plannedTransferTime = (new Date(departure.when) - new Date(arrival.plannedWhen))/1000;
				if(plannedTransferTime >= transferTime){
					//valid connection
					let actualTransferTime = (new Date(departure.when) - new Date(arrival.when))/1000;
					if(actualTransferTime <=0){
						stats.missedConnections +=1;
						stats.details.push(`missed connection to ${departure.direction} as train from ${arrival.provenance} ${arrival.delay/60} minutes late`);
						stats.details.push(`Arrival from ${arrival.provenance} expected at ${arrival.plannedWhen} actually arrived at ${arrival.when}`);
						stats.details.push(`Departure to ${departure.direction} at ${departure.when}`);
					}
					else if(actualTransferTime < transferTime){
						stats.atRisk +=1;
						stats.details.push(`connection at risk to ${departure.direction} as train from ${arrival.provenance} ${arrival.delay/60} minutes late`);
						stats.details.push(`Arrival from ${arrival.provenance} expected at ${arrival.plannedWhen} actually arrived at ${arrival.when}`);
						stats.details.push(`Departure to ${departure.direction} at ${departure.when}`);
					}
				}
				stats.raw["arrival"] = arrival;
				stats.raw["departure"] = departure;		
			});
		}
		else{
			stats.details.push(`${arrival.when} from ${arrival.provenance} on time`);
			stats.onTimeCount +=1;
		}
	});
	return stats;
}
//example
//setting a reasonable transfer time between trains matters!
//getMissedConnctions("8100090")
