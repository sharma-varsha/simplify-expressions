function simplify(filter) {

    const ERR_VAL = 0;
    const ERR_OBJ = { type: 'false' };

    var ret = ERR_OBJ;
    if (!('type' in filter)) {
        throw ('No type in filter');
    }
    if (filter["type"] === 'is') {
        ret = checkIsFilter(filter);
    }

    else if (filter["type"] === 'in') {
        ret = checkInFilter(filter);
    }

    else if (filter["type"] === 'and') {            
        if (filter.filters.length >= 1) {
            ret = checkAndFilter(filter);
        }

    }
    else {
        throw("Wrong type");
    }

    if (ret == ERR_VAL) {
        return ERR_OBJ;
    }
    return ret;


    function checkIsFilter(isFilter) {
        if (!isFilter["attribute"] || !isFilter["value"]) {
            return ERR_VAL;
        }
        return isFilter;
    }

    function checkInFilter(inFilter) {
        if(!inFilter["values"]) {
            throw('In filter needs values');
        }
        if (inFilter["values"].length === 0 || !inFilter["attribute"] ) {
            return ERR_VAL;
        }
        var no_dupes = NoDuplicate(inFilter["values"]);

        if (no_dupes.length === 1) {
            return { type: 'is', attribute: inFilter["attribute"], value: no_dupes[0] };
        }
        return { type: 'in', attribute: inFilter["attribute"], values: no_dupes };
    }

    function checkAndFilter(andFilter){
        sub_filters = andFilter["filters"];
        let result_sub_filters = [];
        // Flag for any statement to be an error, we need to return entire result as error, since its an "AND"
        let is_error = false;
        let ret = ERR_VAL;
        for (let i = 0; i < sub_filters.length; i++){
            switch(sub_filters[i]["type"]) {
                case "in":
                    ret = checkInFilter(sub_filters[i]); 
                    if (ret) {
                        result_sub_filters.push(ret);
                    } else {
                        is_error = true;
                    }
                    break;
                case "is":
                    ret = checkIsFilter(sub_filters[i]);
                    if (ret) { 
                        result_sub_filters.push(ret);
                    } else {
                        is_error = true;
                    }                     
                    break; 
                case "and":                /* Recursion for the nested case */
                    ret = checkAndFilter(sub_filters[i]);
                    if (ret) {
                        let simplified_filters = checkSubFilterAttributes(ret.filters);
                        for (i=0; i<simplified_filters.length; i++) {
                            result_sub_filters.push(simplified_filters[i]);
                        }
                    } else {
                        is_error = true;
                    }
                    break;
                default:
                    is_error = true;
            }
        }
        /* After flatenning the array of filters again check the attributes*/
        let simplified_sub_filters = checkSubFilterAttributes(result_sub_filters);
        if (is_error || !simplified_sub_filters) {
            return ERR_VAL;
        }
        if (simplified_sub_filters.length === 1) {
            return simplified_sub_filters[0];
        }
        return {type:'and', filters: simplified_sub_filters};
    }

    function checkSubFilterAttributes(sub_filters){
        let inConditions = {};
        let isConditions = {};
        let is_error = false;
        let result_and_sub_filters = [];
        for(let i=0; i < sub_filters.length; i++ ) { 
            /*Initilisation of the sub filter attribute data */ 
            if (!isConditions[sub_filters[i]["attribute"]] && 
                sub_filters[i]["type"] === "is") {
                isConditions[sub_filters[i]["attribute"]] = [];
            }
            if (!inConditions[sub_filters[i]["attribute"]] && 
                 sub_filters[i]["type"] === "in") {
                inConditions[sub_filters[i]["attribute"]] = [];
            }

            if (sub_filters[i]["type"] === "in") {
                /* Data Structure used here  
                inConditions:{ 
                        country: [
                            ['United State', 'Mexico'],
                            ['Mexico','United Kingdom']
                        ],
                        browser: [
                            ['Chrome', 'FireFox'],
                            ['FireFox','Safari']
                        ] 
                }
                */       
                inConditions[sub_filters[i]["attribute"]].push(sub_filters[i]["values"]);

            }
            if (sub_filters[i]["type"] === "is") {
                /* Data Structure used here 
                isConditions: {
                    country:['Mexico', 'Palo'],
                    browser:['Opera', 'Safari']    
                }
                */
                isConditions[sub_filters[i]["attribute"]].push(sub_filters[i]["value"]);
            }
        }
        for(var attr in isConditions) {
            no_dupes = NoDuplicate(isConditions[attr]);
            // it is false if any attribute has more than 1 `is` conditions.
            if (no_dupes.length > 1) {
                is_error = true;
                break;
            }            
            result_and_sub_filters.push({type: 'is', attribute : attr, value: no_dupes[0]  });
        }

        if (!is_error) {
            for (var attr in inConditions){
                /* Finding the common values of all the inConditions by each attribute*/
                var intersection = inConditions[attr][0];
                for (let i=1; i < inConditions[attr].length; i++) {
                    intersection = intersection.filter(x=> inConditions[attr][i].includes(x));
                }
                let list_of_common_val = intersection;
                
                if (list_of_common_val.length > 0) {
                    if (list_of_common_val.length == 1) {
                        result_and_sub_filters.push({type:'is', attribute:attr, value:list_of_common_val[0]});
                    } else {
                        result_and_sub_filters.push({type:'in', attribute:attr, values : list_of_common_val })
                    }
                } else {
                    is_error = true;
                    break;
                }        
            }
        } 
        if (!is_error){
            return result_and_sub_filters;
        } else {
            return ERR_VAL;
        }               
    }
    function NoDuplicate(data) {
        return [... new Set(data)];
    }

}
module.exports = simplify;




