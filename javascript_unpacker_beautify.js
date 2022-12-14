/*<![CDATA[*/
/* javascriptobfuscator_unpacker */ 

var JavascriptObfuscator = {
  detect: function(str) {
    return /^var _0x[a-f0-9]+ ?\= ?\[/.test(str);
  },

  unpack: function(str) {
    if (JavascriptObfuscator.detect(str)) {
      var matches = /var (_0x[a-f\d]+) ?\= ?\[(.*?)\];/.exec(str);
      if (matches) {
        var var_name = matches[1];
        var strings = JavascriptObfuscator._smart_split(matches[2]);
        str = str.substring(matches[0].length);
        for (var k in strings) {
          str = str.replace(new RegExp(var_name + '\\[' + k + '\\]', 'g'),
            JavascriptObfuscator._fix_quotes(JavascriptObfuscator._unescape(strings[k])));
        }
      }
    }
    return str;
  },

  _fix_quotes: function(str) {
    var matches = /^"(.*)"$/.exec(str);
    if (matches) {
      str = matches[1];
      str = "'" + str.replace(/'/g, "\\'") + "'";
    }
    return str;
  },

  _smart_split: function(str) {
    var strings = [];
    var pos = 0;
    while (pos < str.length) {
      if (str.charAt(pos) === '"') {
        // new word
        var word = '';
        pos += 1;
        while (pos < str.length) {
          if (str.charAt(pos) === '"') {
            break;
          }
          if (str.charAt(pos) === '\\') {
            word += '\\';
            pos++;
          }
          word += str.charAt(pos);
          pos++;
        }
        strings.push('"' + word + '"');
      }
      pos += 1;
    }
    return strings;
  },


  _unescape: function(str) {
    // inefficient if used repeatedly or on small strings, but wonderful on single large chunk of text
    for (var i = 32; i < 128; i++) {
      str = str.replace(new RegExp('\\\\x' + i.toString(16), 'ig'), String.fromCharCode(i));
    }
    str = str.replace(/\\x09/g, "\t");
    return str;
  },

  run_tests: function(sanity_test) {
    var t = sanity_test || new SanityTest();

    t.test_function(JavascriptObfuscator._smart_split, "JavascriptObfuscator._smart_split");
    t.expect('', []);
    t.expect('"a", "b"', ['"a"', '"b"']);
    t.expect('"aaa","bbbb"', ['"aaa"', '"bbbb"']);
    t.expect('"a", "b\\\""', ['"a"', '"b\\\""']);
    t.test_function(JavascriptObfuscator._unescape, 'JavascriptObfuscator._unescape');
    t.expect('\\x40', '@');
    t.expect('\\x10', '\\x10');
    t.expect('\\x1', '\\x1');
    t.expect("\\x61\\x62\\x22\\x63\\x64", 'ab"cd');
    t.test_function(JavascriptObfuscator.detect, 'JavascriptObfuscator.detect');
    t.expect('', false);
    t.expect('abcd', false);
    t.expect('var _0xaaaa', false);
    t.expect('var _0xaaaa = ["a", "b"]', true);
    t.expect('var _0xaaaa=["a", "b"]', true);
    t.expect('var _0x1234=["a","b"]', true);
    return t;
  }


};

/* jmyobfuscate_unpacker */ 
var MyObfuscate = {
  detect: function(str) {
    if (/^var _?[0O1lI]{3}\=('|\[).*\)\)\);/.test(str)) {
      return true;
    }
    if (/^function _?[0O1lI]{3}\(_/.test(str) && /eval\(/.test(str)) {
      return true;
    }
    return false;
  },

  unpack: function(str) {
    if (MyObfuscate.detect(str)) {
      var __eval = eval;
      try {
        eval = function(unpacked) { // jshint ignore:line
          if (MyObfuscate.starts_with(unpacked, 'var _escape')) {
            // fetch the urlencoded stuff from the script,
            var matches = /'([^']*)'/.exec(unpacked);
            var unescaped = unescape(matches[1]);
            if (MyObfuscate.starts_with(unescaped, '<script>')) {
              unescaped = unescaped.substr(8, unescaped.length - 8);
            }
            if (MyObfuscate.ends_with(unescaped, '</script>')) {
              unescaped = unescaped.substr(0, unescaped.length - 9);
            }
            unpacked = unescaped;
          }
          // throw to terminate the script
          unpacked = "// Unpacker warning: be careful when using myobfuscate.com for your projects:\n" +
            "// scripts obfuscated by the free online version may call back home.\n" +
            "\n//\n" + unpacked;
          throw unpacked;
        }; // jshint ignore:line
        __eval(str); // should throw
      } catch (e) {
        // well, it failed. we'll just return the original, instead of crashing on user.
        if (typeof e === "string") {
          str = e;
        }
      }
      eval = __eval; // jshint ignore:line
    }
    return str;
  },

  starts_with: function(str, what) {
    return str.substr(0, what.length) === what;
  },

  ends_with: function(str, what) {
    return str.substr(str.length - what.length, what.length) === what;
  },

  run_tests: function(sanity_test) {
    var t = sanity_test || new SanityTest();

    return t;
  }


};

/* p_a_c_k_e_r_unpacker */ 
var P_A_C_K_E_R = {
  detect: function(str) {
    return (P_A_C_K_E_R.get_chunks(str).length > 0);
  },

  get_chunks: function(str) {
    var chunks = str.match(/eval\(\(?function\(.*?(,0,\{\}\)\)|split\('\|'\)\)\))($|\n)/g);
    return chunks ? chunks : [];
  },

  unpack: function(str) {
    var chunks = P_A_C_K_E_R.get_chunks(str),
      chunk;
    for (var i = 0; i < chunks.length; i++) {
      chunk = chunks[i].replace(/\n$/, '');
      str = str.split(chunk).join(P_A_C_K_E_R.unpack_chunk(chunk));
    }
    return str;
  },

  unpack_chunk: function(str) {
    var unpacked_source = '';
    var __eval = eval;
    if (P_A_C_K_E_R.detect(str)) {
      try {
        eval = function(s) { // jshint ignore:line
          unpacked_source += s;
          return unpacked_source;
        }; // jshint ignore:line
        __eval(str);
        if (typeof unpacked_source === 'string' && unpacked_source) {
          str = unpacked_source;
        }
      } catch (e) {
        // well, it failed. we'll just return the original, instead of crashing on user.
      }
    }
    eval = __eval; // jshint ignore:line
    return str;
  },

  run_tests: function(sanity_test) {
    var t = sanity_test || new SanityTest();

    var pk1 = "eval(function(p,a,c,k,e,r){e=String;if(!''.replace(/^/,String)){while(c--)r[c]=k[c]||c;k=[function(e){return r[e]}];e=function(){return'\\\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\\\b'+e(c)+'\\\\b','g'),k[c]);return p}('0 2=1',3,3,'var||a'.split('|'),0,{}))";
    var unpk1 = 'var a=1';
    var pk2 = "eval(function(p,a,c,k,e,r){e=String;if(!''.replace(/^/,String)){while(c--)r[c]=k[c]||c;k=[function(e){return r[e]}];e=function(){return'\\\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\\\b'+e(c)+'\\\\b','g'),k[c]);return p}('0 2=1',3,3,'foo||b'.split('|'),0,{}))";
    var unpk2 = 'foo b=1';
    var pk_broken = "eval(function(p,a,c,k,e,r){BORKBORK;if(!''.replace(/^/,String)){while(c--)r[c]=k[c]||c;k=[function(e){return r[e]}];e=function(){return'\\\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\\\b'+e(c)+'\\\\b','g'),k[c]);return p}('0 2=1',3,3,'var||a'.split('|'),0,{}))";
    var pk3 = "eval(function(p,a,c,k,e,r){e=String;if(!''.replace(/^/,String)){while(c--)r[c]=k[c]||c;k=[function(e){return r[e]}];e=function(){return'\\\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\\\b'+e(c)+'\\\\b','g'),k[c]);return p}('0 2=1{}))',3,3,'var||a'.split('|'),0,{}))";
    var unpk3 = 'var a=1{}))';

    t.test_function(P_A_C_K_E_R.detect, "P_A_C_K_E_R.detect");
    t.expect('', false);
    t.expect('var a = b', false);
    t.test_function(P_A_C_K_E_R.unpack, "P_A_C_K_E_R.unpack");
    t.expect(pk_broken, pk_broken);
    t.expect(pk1, unpk1);
    t.expect(pk2, unpk2);
    t.expect(pk3, unpk3);

    var filler = '\nfiller\n';
    t.expect(filler + pk1 + "\n" + pk_broken + filler + pk2 + filler, filler + unpk1 + "\n" + pk_broken + filler + unpk2 + filler);

    return t;
  }


};

/* urlencode_unpacker */ 
var isNode = (typeof module !== 'undefined' && module.exports);
if (isNode) {
  var SanityTest = require(__dirname + '/../../test/sanitytest');
}

var Urlencoded = {
  detect: function(str) {
    // the fact that script doesn't contain any space, but has %20 instead
    // should be sufficient check for now.
    if (str.indexOf(' ') === -1) {
      if (str.indexOf('%2') !== -1) return true;
      if (str.replace(/[^%]+/g, '').length > 3) return true;
    }
    return false;
  },

  unpack: function(str) {
    if (Urlencoded.detect(str)) {
      if (str.indexOf('%2B') !== -1 || str.indexOf('%2b') !== -1) {
        // "+" escaped as "%2B"
        return unescape(str.replace(/\+/g, '%20'));
      } else {
        return unescape(str);
      }
    }
    return str;
  },



  run_tests: function(sanity_test) {
    var t = sanity_test || new SanityTest();
    t.test_function(Urlencoded.detect, "Urlencoded.detect");
    t.expect('', false);
    t.expect('var a = b', false);
    t.expect('var%20a+=+b', true);
    t.expect('var%20a=b', true);
    t.expect('var%20%21%22', true);
    t.expect('javascript:(function(){var%20whatever={init:function(){alert(%22a%22+%22b%22)}};whatever.init()})();', true);
    t.test_function(Urlencoded.unpack, 'Urlencoded.unpack');

    t.expect('javascript:(function(){var%20whatever={init:function(){alert(%22a%22+%22b%22)}};whatever.init()})();',
      'javascript:(function(){var whatever={init:function(){alert("a"+"b")}};whatever.init()})();'
    );
    t.expect('', '');
    t.expect('abcd', 'abcd');
    t.expect('var a = b', 'var a = b');
    t.expect('var%20a=b', 'var a=b');
    t.expect('var%20a=b+1', 'var a=b+1');
    t.expect('var%20a=b%2b1', 'var a=b+1');
    return t;
  }


};

if (isNode) {
  module.exports = Urlencoded;
}
 /*]]>*/