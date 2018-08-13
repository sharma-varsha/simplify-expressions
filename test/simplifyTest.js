const expect = require('chai').expect;
const simplify = require('../simplify');


describe("simplify - basic tests 1", function() {

    it("malformed filter with no type throws an error", function() {
      expect(function() {
        simplify({
          attribute: 'country', value: 'United States'
        });
      }).to.throw()
    });

    it("malformed filter with wrong type throws an error", function() {
      expect(function() {
        simplify({
          type:'peek',  attribute: 'country', value: 'United States'
        });
      }).to.throw()
    });
  
    it("malformed `in` throws an error", function() {
      expect(function() {
        simplify({
          type: 'in', attribute: 'country', value: 'United States, Mexico'
        });
      }).to.throw()
    });
  
    it("A filter of 'country is Mexico' is enough", function() {
      expect(simplify({
        type: 'and',
        filters: [
          { type: 'in', attribute: 'country', values: ['United States', 'Mexico'] },
          { type: 'in', attribute: 'country', values: ['Mexico', 'United Kingdom'] }
        ]
      })).to.deep.equal({
        type: 'is', attribute: 'country', value: 'Mexico'
      });
    });

    it("`is` of type and no attribute and no value", function() {
      expect(simplify({
          type:'is', attribute: 'something', value: ''
        })).to.deep.equal({
        type:'false'
      });
    });

    it("`is` of type and no attribute and  value - 122", function() {
      expect(simplify({
          type:'is', attribute: 'something', value: 'hghg'
        })).to.deep.equal({
          type:'is', attribute: 'something', value: 'hghg'
      });
    });
    it("`in` of no values would match no values", function() {
      expect(simplify({
        type: 'in', attribute: 'country', values: []
      })).to.deep.equal({
        type: 'false'
      });
    });
  
    it("`in` with one value is basically an IS", function() {
      expect(simplify({
        type: 'in', attribute: 'country', values: ['Mexico']
      })).to.deep.equal({
        type: 'is', attribute: 'country', value: 'Mexico'
      });
    });

      it("`in` doesn't need to have duplicate values", function() {
      expect(simplify({
        type: 'in', attribute: 'country', values: ['United States', 'Mexico', 'Mexico']
      })).to.deep.equal({
        type:'in', values: ['United States', 'Mexico'], attribute:'country'
      });
    });
    
    it("A country can not be both United States and United Kingdom", function() {
      expect(simplify({
        type: 'and',
        filters: [
          { type: 'is', attribute: 'country', value: 'United States' },
          { type: 'is', attribute: 'country', value: 'United Kingdom' }
        ]
      })).to.deep.equal({
        type: 'false'
      });
    });

    it("country=UK, browser=Firefox", function() {
      expect(simplify({
        type: 'and',
        filters: [
          { type: 'is', attribute: 'browser', value: 'Firefox' },
          { type: 'is', attribute: 'country', value: 'United Kingdom' }
        ]
      })).to.deep.equal({
        type: 'and',
        filters: [
          { type: 'is', attribute: 'browser', value: 'Firefox' },
          { type: 'is', attribute: 'country', value: 'United Kingdom' }
        ]
      });
    });

    it("Nothing to do here", function() {
      expect(simplify({
        type: 'and',
        filters: [
          { type: 'is', attribute: 'country', value: 'United States' },
          { type: 'is', attribute: 'state', value: 'California' }
        ]
      })).to.deep.equal({
        type: 'and',
        filters: [
          { type: 'is', attribute: 'country', value: 'United States' },
          { type: 'is', attribute: 'state', value: 'California' },
        ]
      });
    });

    it("A nested `and` with wrong type", function() {
      expect(simplify({
        type: 'and',
        filters: [
          { type: 'is', attribute: 'country', value: 'United States' },
          {
            type: 'and',
            filters: [
              { type: 'peek', attribute: 'device', value: 'iPhone' },
              { type: 'is', attribute: 'state', value: 'California' }
            ]
          }
        ]
      })).to.deep.equal({
        type: 'false'
      });
    }); 

    it("A nested `and` should become flat", function() {
      expect(simplify({
        type: 'and',
        filters: [
          { type: 'is', attribute: 'country', value: 'United States' },
          {
            type: 'and',
            filters: [
              { type: 'is', attribute: 'device', value: 'iPhone' },
              { type: 'is', attribute: 'state', value: 'California' }
            ]
          }
        ]
      })).to.deep.equal({
        type: 'and',
        filters: [
          { type: 'is', attribute: 'country', value: 'United States' },
          { type: 'is', attribute: 'device', value: 'iPhone' },
          { type: 'is', attribute: 'state', value: 'California' }
        ]
      });
    }); 

    it("A nested `and` with the attributes same", function() {
      expect(simplify({
        type: 'and',
        filters: [
          { type: 'is', attribute: 'country', value: 'United States' },
          {
            type: 'and',
            filters: [
              { type: 'is', attribute: 'country', value: 'Mexico' },
              { type: 'is', attribute: 'state', value: 'California' }
            ]
          }
        ]
      })).to.deep.equal({
        type: 'false'
      });
    });

     it("Check if the filters with the 'and' type is an array", function() {
      expect(simplify({
        type: 'and',
        filters: [
          { type: 'is', attribute: 'country', value: 'United States' },
          { type: 'is', attribute: 'state', value: 'California' }
        ]
      })).to.deep.equal({
        type: 'and',
        filters: [
          { type: 'is', attribute: 'country', value: 'United States' },
          { type: 'is', attribute: 'state', value: 'California' }
        ]
      });
    });

    it("Check the nested filters with the 'and' type ", function() {
      expect(simplify({
        type: 'and',
        filters: [
          { type: 'is', attribute: 'country', value: 'United States' },
          { type: 'in', attribute: 'state', values: ['California','New York'] },
          {
            type: 'and',
            filters: [
              { type: 'is', attribute: 'device', value: 'Iphone' },
              { type: 'in', attribute: 'state', values: ['California','Florida'] }
            ]
          }
        ]
      })).to.deep.equal({
        type: 'and',
        filters: [
          { type: 'is', attribute: 'country', value: 'United States' },
          { type: 'is', attribute: 'device', value: 'Iphone' },
          { type: 'is', attribute: 'state', value: 'California' }          
        ]
      });
    });
  


    it("A filter of 'country is Mexico' is enough", function() {
      expect(simplify({
        type: 'and',
        filters: [
          { type: 'in', attribute: 'country', values: ['United States', 'Mexico'] },
          { type: 'in', attribute: 'country', values: ['Mexico', 'United Kingdom'] }
        ]
      })).to.deep.equal({
        type: 'is', attribute: 'country', value: 'Mexico'
      });
    });
  
    it("Check the nested complex filters with the 'and' type ", function() {
      expect(simplify({
        type: 'and',
        filters: [
          { type: 'is', attribute: 'country', value: 'United States' },
          { type: 'in', attribute: 'state', values: ['California','New York'] },
          {
            type: 'and',
            filters: [
              { type: 'is', attribute: 'device', value: 'Iphone' },
              { type: 'is', attribute: 'device', value: 'Iphone' },
              { type: 'in', attribute: 'state', values: ['California','Florida', 'Washington'] },
              {
                type: 'and',
                filters: [
                  { type: 'in', attribute: 'browser', values: ['Firefox', 'Chrome', 'Opera' ]},
                  { type: 'in', attribute: 'browser', values: ['Chrome', 'Safari', 'Firefox' ] },
                  { type: 'in', attribute: 'state', values: ['California','Texas','Washington'] }
                  
                ]
              }
            ]
          }
        ]
      })).to.deep.equal({
        type: 'and',
        filters: [
          { type: 'is', attribute: 'country', value: 'United States' },
          { type: 'is', attribute: 'device', value: 'Iphone' },
          { type: 'is', attribute: 'state', value: 'California' },
          { type: 'in', attribute: 'browser', values: ['Firefox', 'Chrome' ]}
  
        ]
      });
    });

  });