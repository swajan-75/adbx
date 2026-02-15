export namespace main {
	
	export class Device {
	    id: string;
	
	    static createFrom(source: any = {}) {
	        return new Device(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	    }
	}
	export class Recent {
	    ID: number;
	    URL: string;
	    Date: string;
	    Time: string;
	
	    static createFrom(source: any = {}) {
	        return new Recent(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.URL = source["URL"];
	        this.Date = source["Date"];
	        this.Time = source["Time"];
	    }
	}

}

