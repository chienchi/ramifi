var igvwebConfig = {

    genomes: "resources/genomes.json",
    trackRegistryFile: "resources/tracks/trackRegistry.json",
    sessionRegistryFile: "resources/sessions/sessionRegistry.json",

    // Supply a drobpox api key to enable the Dropbox file picker in the load menus.  This is optional
    //dropboxAPIKey: "...",

    // Supply a Google client id to enable the Google file picker in the load menus.  This is optional
    //clientId: "...",
    // apiKey: "...",

    // Provide a URL shorterner function or object.   This is optional.  If not supplied
    // sharable URLs will not be shortened .
    urlShortener: {
        provider: "tinyURL"
    },

    enableCircularView: true,

    igvConfig:
        {
            //genome: "Wuhan-Hu-1",
            locus: "NC_045512.2:24360-24520",
            genomeList: "resources/genomes.json",
            queryParametersSupported: true,
            showChromosomeWidget: false,
            showSVGButton: false,
            reference:{
			//"id": "EDGE-COVID19",
				"name": "Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1",
				"fastaURL": "../data/SARS-CoV2/NC_045512_full.fasta",
				"indexURL": "../data/SARS-CoV2/NC_045512_full.fasta.fai"
			},
            tracks: [
            	{
					'format': "gff3",
                    'displayMode': "expanded",
                    'height': 100,
                    'url': "../data/SARS-CoV2/NC_045512.2.gbk.gff",
                    'indexed': false,
                    'filterTypes': ['region'],
                    'visibilityWindow': 1000000
				},
				{  
					'name':"Variants Mutations", 
					'format':"gff3", 
					'displayMode':"expanded", 
					'height': 200, 
					'url': "../data/variants_mutation.gff", 
					'indexed': false, 
					'visibilityWindow':32000, 
					'colorBy':"Variant"
				},
				{
					'name': 'Recombinant 1', 
					'type':'alignment', 
					'format': 'bam', 
					'colorBy': 'strand', 
					'url': '../data/recombinant_reads.recomb1.bam', 
					'indexURL': '../data/recombinant_reads.recomb1.bam.bai',
					'squishedRowHeight': 10,
					'height': 250,
					'displayMode': 'SQUISHED' 
				},
				{
					'name': 'Recombinant 2', 
					'type':'alignment', 
					'format': 'bam', 
					'colorBy': 'strand', 
					'url': '../data/recombinant_reads.recomb2.bam', 
					'indexURL': '../data/recombinant_reads.recomb2.bam.bai',
					'squishedRowHeight': 10,
					'height': 250,
					'displayMode': 'SQUISHED' 
				},
				{
					'name': 'Parent Omicron', 
					'type':'alignment', 
					'format': 'bam', 
					'colorBy': 'strand', 
					'url': '../data/recombinant_reads.parent1.bam', 
					'indexURL': '../data/recombinant_reads.parent1.bam.bai',
					'squishedRowHeight': 10,
					'height': 250,
					'displayMode': 'SQUISHED' 
				},
				{
					'name': 'Parent Delta', 
					'type':'alignment', 
					'format': 'bam', 
					'colorBy': 'strand', 
					'url': '../data/recombinant_reads.parent2.bam', 
					'indexURL': '../data/recombinant_reads.parent2.bam.bai',
					'squishedRowHeight': 10,
					'height': 250,
					'displayMode': 'SQUISHED' 
				},
				
            ]
        }

}
