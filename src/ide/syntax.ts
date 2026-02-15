// =================================================================
// Syntax Highlighting Engine for all supported languages
// =================================================================

export interface Token {
  text: string;
  type: 'keyword' | 'string' | 'comment' | 'number' | 'operator' | 'function' |
        'type' | 'variable' | 'property' | 'tag' | 'attribute' | 'punctuation' |
        'decorator' | 'builtin' | 'constant' | 'namespace' | 'plain';
}

const LANG_KEYWORDS: Record<string, string[]> = {
  javascript: ['const','let','var','function','return','if','else','for','while','do','switch','case','default','break','continue','new','delete','typeof','instanceof','in','of','class','extends','super','this','import','from','export','default','async','await','yield','try','catch','finally','throw','void','null','undefined','true','false','NaN','Infinity','static','get','set'],
  typescript: ['const','let','var','function','return','if','else','for','while','do','switch','case','default','break','continue','new','delete','typeof','instanceof','in','of','class','extends','super','this','import','from','export','default','async','await','yield','try','catch','finally','throw','void','null','undefined','true','false','NaN','Infinity','static','get','set','interface','type','enum','namespace','implements','declare','abstract','readonly','as','is','keyof','infer','never','unknown','any'],
  python: ['def','class','return','if','elif','else','for','while','break','continue','import','from','as','try','except','finally','raise','with','yield','lambda','pass','del','global','nonlocal','assert','True','False','None','and','or','not','in','is','async','await'],
  ruby: ['def','class','module','end','if','elsif','else','unless','while','until','for','do','begin','rescue','ensure','raise','return','yield','block_given?','self','super','true','false','nil','and','or','not','in','require','include','extend','attr_accessor','attr_reader','attr_writer','puts','print','p'],
  rust: ['fn','let','mut','const','if','else','match','loop','while','for','in','return','break','continue','struct','enum','impl','trait','type','pub','mod','use','crate','self','super','as','where','async','await','move','ref','static','unsafe','extern','true','false','Some','None','Ok','Err'],
  go: ['func','var','const','if','else','for','range','switch','case','default','return','break','continue','go','defer','select','chan','map','struct','interface','type','package','import','true','false','nil','make','new','len','cap','append','copy','delete','panic','recover'],
  cpp: ['int','float','double','char','bool','void','long','short','unsigned','signed','auto','const','static','extern','register','volatile','inline','virtual','override','final','class','struct','enum','union','namespace','using','template','typename','typedef','public','private','protected','friend','new','delete','return','if','else','for','while','do','switch','case','default','break','continue','try','catch','throw','true','false','nullptr','this','sizeof','constexpr','noexcept','include','define'],
  c: ['int','float','double','char','void','long','short','unsigned','signed','auto','const','static','extern','register','volatile','struct','enum','union','typedef','return','if','else','for','while','do','switch','case','default','break','continue','sizeof','NULL','true','false','include','define'],
  csharp: ['using','namespace','class','struct','interface','enum','delegate','event','public','private','protected','internal','static','readonly','const','virtual','override','abstract','sealed','new','return','if','else','for','foreach','while','do','switch','case','default','break','continue','try','catch','finally','throw','async','await','var','string','int','float','double','bool','void','object','true','false','null','this','base','get','set','value','partial','where','is','as','in','out','ref','params','yield'],
  kotlin: ['fun','val','var','class','object','interface','enum','data','sealed','abstract','open','override','private','public','protected','internal','return','if','else','when','for','while','do','break','continue','try','catch','finally','throw','import','package','is','as','in','out','by','companion','init','constructor','suspend','lateinit','lazy','true','false','null','this','super','it'],
  swift: ['func','var','let','class','struct','enum','protocol','extension','import','return','if','else','guard','switch','case','default','for','while','repeat','break','continue','throw','throws','try','catch','do','as','is','in','inout','self','super','true','false','nil','static','override','private','public','internal','fileprivate','open','lazy','weak','unowned','init','deinit','subscript','typealias','associatedtype','where','mutating','optional','required','convenience','final','async','await'],
  html: ['html','head','body','div','span','p','a','h1','h2','h3','h4','h5','h6','ul','ol','li','table','tr','td','th','form','input','button','select','option','textarea','img','link','script','style','meta','title','header','footer','nav','main','section','article','aside','figure','figcaption','video','audio','source','canvas','svg','iframe'],
  css: ['color','background','background-color','font-size','font-family','font-weight','margin','padding','border','display','position','top','right','bottom','left','width','height','max-width','min-width','max-height','min-height','flex','grid','align-items','justify-content','text-align','text-decoration','overflow','opacity','z-index','transition','transform','animation','box-shadow','border-radius','cursor','content'],
  json: [],
  xml: [],
  toml: [],
  markdown: [],
  text: [],
};

const BUILTIN_FUNCTIONS: Record<string, string[]> = {
  javascript: ['console','Math','JSON','Array','Object','String','Number','Boolean','Date','Promise','Map','Set','WeakMap','WeakSet','RegExp','Error','Symbol','parseInt','parseFloat','isNaN','isFinite','setTimeout','setInterval','clearTimeout','clearInterval','fetch','alert','confirm','prompt','require','module','exports','process','Buffer','document','window','navigator'],
  typescript: ['console','Math','JSON','Array','Object','String','Number','Boolean','Date','Promise','Map','Set','WeakMap','WeakSet','RegExp','Error','Symbol','parseInt','parseFloat','isNaN','isFinite','setTimeout','setInterval','clearTimeout','clearInterval','fetch','Partial','Required','Readonly','Record','Pick','Omit','Exclude','Extract','NonNullable','ReturnType','Parameters','InstanceType'],
  python: ['print','len','range','type','str','int','float','bool','list','dict','tuple','set','frozenset','enumerate','zip','map','filter','sorted','reversed','sum','min','max','abs','round','input','open','super','property','classmethod','staticmethod','isinstance','issubclass','hasattr','getattr','setattr','delattr','dir','vars','id','hash','repr','format','iter','next','all','any'],
  ruby: ['puts','print','p','gets','chomp','to_s','to_i','to_f','length','size','each','map','select','reject','reduce','inject','sort','sort_by','flatten','compact','uniq','first','last','push','pop','shift','unshift','include?','empty?','nil?','freeze','frozen?','dup','clone','respond_to?','send','method_missing'],
  rust: ['println','print','eprintln','eprint','format','vec','String','Box','Rc','Arc','Cell','RefCell','Mutex','HashMap','HashSet','BTreeMap','BTreeSet','Vec','Option','Result','Iterator','Into','From','Display','Debug','Clone','Copy','Default','Eq','PartialEq','Ord','PartialOrd','Hash','Send','Sync'],
  go: ['fmt','Println','Printf','Sprintf','Fprintf','Errorf','errors','New','strings','strconv','time','math','os','io','bufio','net','http','json','xml','context','sync','sort','bytes'],
  cpp: ['cout','cin','endl','cerr','clog','printf','scanf','malloc','calloc','realloc','free','memcpy','memset','strlen','strcmp','strcpy','strcat','sizeof','vector','string','map','set','unordered_map','unordered_set','list','deque','queue','stack','priority_queue','pair','make_pair','tuple','make_tuple','sort','find','begin','end','size','push_back','pop_back','front','back','insert','erase','clear','empty','swap','reverse','unique','lower_bound','upper_bound','min_element','max_element','accumulate','transform','for_each'],
  c: ['printf','scanf','fprintf','fscanf','sprintf','sscanf','malloc','calloc','realloc','free','memcpy','memset','memmove','strlen','strcmp','strcpy','strcat','strncpy','strncmp','strtol','strtod','atoi','atof','fopen','fclose','fread','fwrite','fgets','fputs','getchar','putchar','getc','putc','exit','abort','system','qsort','bsearch','rand','srand','time','clock','sizeof'],
  csharp: ['Console','WriteLine','ReadLine','Write','Read','String','Int32','Double','Boolean','List','Dictionary','Array','StringBuilder','DateTime','TimeSpan','Task','Thread','Linq','Where','Select','OrderBy','GroupBy','FirstOrDefault','Single','Count','Sum','Max','Min','Average','ToList','ToArray','ToDictionary','Contains','Any','All','Concat','Join','Split','Replace','Trim','Format','Parse','TryParse','ToString','Equals','GetType','GetHashCode'],
  kotlin: ['println','print','listOf','mutableListOf','mapOf','mutableMapOf','setOf','mutableSetOf','arrayOf','intArrayOf','to','Pair','Triple','repeat','require','check','also','apply','let','run','with','takeIf','takeUnless','forEach','map','filter','reduce','fold','flatMap','groupBy','sortedBy','first','last','find','any','all','none','count','sum','max','min','average','joinToString','toList','toMap','toSet','toMutableList'],
  swift: ['print','debugPrint','dump','String','Int','Double','Float','Bool','Array','Dictionary','Set','Optional','Result','Error','URL','Data','Date','Calendar','Timer','DispatchQueue','Task','AsyncSequence','map','filter','reduce','compactMap','flatMap','forEach','sorted','contains','first','last','count','isEmpty','append','insert','remove','removeAll','enumerated','zip','stride','max','min','abs','round','ceil','floor','sqrt','pow','log'],
};

const TYPE_NAMES: Record<string, string[]> = {
  javascript: ['Array','Object','String','Number','Boolean','Function','Symbol','BigInt','Promise','Map','Set','WeakMap','WeakSet','RegExp','Error','TypeError','RangeError','SyntaxError','ReferenceError','Date','ArrayBuffer','DataView','Float32Array','Float64Array','Int8Array','Int16Array','Int32Array','Uint8Array','Uint16Array','Uint32Array','HTMLElement','Element','Node','Event','Response','Request','Headers','URL','URLSearchParams'],
  typescript: ['Array','Object','String','Number','Boolean','Function','Symbol','BigInt','Promise','Map','Set','WeakMap','WeakSet','RegExp','Error','Date','void','any','unknown','never','undefined','null','string','number','boolean','symbol','bigint','object','Partial','Required','Readonly','Record','Pick','Omit','Exclude','Extract','NonNullable','ReturnType','Parameters','InstanceType','ConstructorParameters','ThisType','Awaited'],
  python: ['int','str','float','bool','list','dict','tuple','set','frozenset','bytes','bytearray','memoryview','complex','type','object','None','Callable','Optional','Union','Any','TypeVar','Generic','Protocol','Final','Literal','ClassVar','Annotated','Iterator','Generator','Coroutine','AsyncGenerator','AsyncIterator','Sequence','Mapping','MutableMapping','MutableSequence','MutableSet','FrozenSet','Deque','Counter','OrderedDict','DefaultDict','ChainMap','NamedTuple','TypedDict','Enum','IntEnum','Flag','IntFlag'],
  rust: ['i8','i16','i32','i64','i128','isize','u8','u16','u32','u64','u128','usize','f32','f64','bool','char','str','String','Vec','Box','Rc','Arc','Cell','RefCell','Mutex','RwLock','HashMap','HashSet','BTreeMap','BTreeSet','Option','Result','Iterator','IntoIterator','Display','Debug','Clone','Copy','Send','Sync','Sized','Drop','Fn','FnMut','FnOnce','Future','Pin','PhantomData'],
  go: ['int','int8','int16','int32','int64','uint','uint8','uint16','uint32','uint64','uintptr','float32','float64','complex64','complex128','bool','byte','rune','string','error','any','comparable','Reader','Writer','Closer','ReadWriter','ReadCloser','WriteCloser','ReadWriteCloser','Stringer','Handler','HandlerFunc','Request','Response','ResponseWriter','Server','Client','Context','Duration','Time','Mutex','RWMutex','WaitGroup','Once','Map','Decoder','Encoder'],
  cpp: ['int','float','double','char','bool','void','long','short','unsigned','signed','size_t','ptrdiff_t','int8_t','int16_t','int32_t','int64_t','uint8_t','uint16_t','uint32_t','uint64_t','string','wstring','vector','map','set','unordered_map','unordered_set','list','deque','queue','stack','priority_queue','pair','tuple','optional','variant','any','shared_ptr','unique_ptr','weak_ptr','array','span','string_view','function','thread','mutex','future','promise','atomic','ostream','istream','iostream','ifstream','ofstream','fstream','stringstream','ostringstream','istringstream'],
  c: ['int','float','double','char','void','long','short','unsigned','signed','size_t','ptrdiff_t','int8_t','int16_t','int32_t','int64_t','uint8_t','uint16_t','uint32_t','uint64_t','FILE','DIR','pid_t','off_t','ssize_t','time_t','clock_t','bool','_Bool'],
  csharp: ['int','float','double','char','bool','void','string','byte','sbyte','short','ushort','uint','long','ulong','decimal','object','dynamic','var','nint','nuint','List','Dictionary','HashSet','Queue','Stack','LinkedList','SortedList','SortedSet','SortedDictionary','ConcurrentDictionary','IEnumerable','IList','IDictionary','ICollection','IQueryable','IObservable','Task','ValueTask','Action','Func','Predicate','Comparison','Nullable','Span','Memory','ReadOnlySpan','ReadOnlyMemory','StringBuilder','Stream','FileStream','MemoryStream','StreamReader','StreamWriter','HttpClient','HttpResponseMessage','JsonSerializer','Regex','Match','CancellationToken'],
  kotlin: ['Int','Long','Short','Byte','Float','Double','Char','Boolean','String','Unit','Nothing','Any','Array','IntArray','LongArray','FloatArray','DoubleArray','BooleanArray','CharArray','List','MutableList','Map','MutableMap','Set','MutableSet','Pair','Triple','Sequence','Iterable','Iterator','Comparable','Throwable','Exception','RuntimeException','IllegalArgumentException','IllegalStateException','UnsupportedOperationException','NullPointerException','IndexOutOfBoundsException','ClassCastException','ArithmeticException','NumberFormatException','ConcurrentModificationException'],
  swift: ['Int','Int8','Int16','Int32','Int64','UInt','UInt8','UInt16','UInt32','UInt64','Float','Double','Float80','Bool','String','Character','Void','Never','Any','AnyObject','Optional','Array','Dictionary','Set','Range','ClosedRange','Substring','Data','Date','URL','UUID','Error','DecodingError','EncodingError','Result','Task','AsyncSequence','AsyncStream','Codable','Encodable','Decodable','Hashable','Equatable','Comparable','Identifiable','CustomStringConvertible','CaseIterable','RawRepresentable','ObservableObject','Published','State','Binding','Environment','EnvironmentObject','ObservedObject','StateObject','View','some'],
};

export function tokenizeLine(line: string, lang: string): Token[] {
  if (!lang || lang === 'text' || lang === 'markdown') {
    return [{ text: line, type: 'plain' }];
  }

  const tokens: Token[] = [];
  const keywords = new Set(LANG_KEYWORDS[lang] || []);
  const builtins = new Set(BUILTIN_FUNCTIONS[lang] || []);
  const types = new Set(TYPE_NAMES[lang] || []);

  let i = 0;
  let current = '';

  const flush = () => {
    if (current) {
      tokens.push({ text: current, type: 'plain' });
      current = '';
    }
  };

  const addToken = (text: string, type: Token['type']) => {
    flush();
    tokens.push({ text, type });
  };

  while (i < line.length) {
    const ch = line[i];
    const rest = line.substring(i);

    // HTML/XML tags
    if ((lang === 'html' || lang === 'xml') && ch === '<') {
      flush();
      // Check for comment
      if (rest.startsWith('<!--')) {
        const end = line.indexOf('-->', i + 4);
        const commentEnd = end >= 0 ? end + 3 : line.length;
        addToken(line.substring(i, commentEnd), 'comment');
        i = commentEnd;
        continue;
      }
      // Match the whole tag
      let tagEnd = i + 1;
      let inAttrStr = false;
      let attrCh = '';
      while (tagEnd < line.length) {
        const tc = line[tagEnd];
        if (inAttrStr) {
          if (tc === attrCh) inAttrStr = false;
        } else {
          if (tc === '"' || tc === "'") { inAttrStr = true; attrCh = tc; }
          else if (tc === '>') { tagEnd++; break; }
        }
        tagEnd++;
      }
      const tagContent = line.substring(i, tagEnd);
      // Parse tag into subparts
      const tagMatch = tagContent.match(/^(<\/?)([\w-]+)/);
      if (tagMatch) {
        addToken(tagMatch[1], 'punctuation');
        addToken(tagMatch[2], 'tag');
        let attrPart = tagContent.substring(tagMatch[0].length);
        // Parse attributes
        while (attrPart.length > 0) {
          const closingMatch = attrPart.match(/^(\s*\/?>)/);
          if (closingMatch) {
            addToken(closingMatch[1], 'punctuation');
            attrPart = attrPart.substring(closingMatch[0].length);
            break;
          }
          const attrMatch = attrPart.match(/^(\s+)([\w-]+)(=)("(?:[^"]*)")|^(\s+)([\w-]+)(=)('(?:[^']*)')|^(\s+)([\w-]+)/);
          if (attrMatch) {
            if (attrMatch[1]) {
              addToken(attrMatch[1], 'plain');
              addToken(attrMatch[2], 'attribute');
              addToken(attrMatch[3], 'operator');
              addToken(attrMatch[4], 'string');
            } else if (attrMatch[5]) {
              addToken(attrMatch[5], 'plain');
              addToken(attrMatch[6], 'attribute');
              addToken(attrMatch[7], 'operator');
              addToken(attrMatch[8], 'string');
            } else if (attrMatch[9]) {
              addToken(attrMatch[9], 'plain');
              addToken(attrMatch[10], 'attribute');
            }
            attrPart = attrPart.substring(attrMatch[0].length);
          } else {
            addToken(attrPart[0], 'plain');
            attrPart = attrPart.substring(1);
          }
        }
      } else {
        addToken(tagContent, 'tag');
      }
      i = tagEnd;
      continue;
    }

    // Line comments
    if ((lang !== 'html' && lang !== 'xml' && lang !== 'css') && rest.startsWith('//') && lang !== 'python' && lang !== 'ruby') {
      flush();
      addToken(rest, 'comment');
      i = line.length;
      continue;
    }
    // Python/Ruby comments
    if ((lang === 'python' || lang === 'ruby' || lang === 'toml') && ch === '#') {
      flush();
      addToken(rest, 'comment');
      i = line.length;
      continue;
    }
    // CSS comments
    if (lang === 'css' && rest.startsWith('/*')) {
      flush();
      const end = line.indexOf('*/', i + 2);
      const commentEnd = end >= 0 ? end + 2 : line.length;
      addToken(line.substring(i, commentEnd), 'comment');
      i = commentEnd;
      continue;
    }
    // Block comment start
    if (rest.startsWith('/*') && lang !== 'html' && lang !== 'python' && lang !== 'ruby') {
      flush();
      const end = line.indexOf('*/', i + 2);
      const commentEnd = end >= 0 ? end + 2 : line.length;
      addToken(line.substring(i, commentEnd), 'comment');
      i = commentEnd;
      continue;
    }

    // C preprocessor
    if ((lang === 'cpp' || lang === 'c') && ch === '#' && line.trimStart().startsWith('#')) {
      flush();
      addToken(rest, 'decorator');
      i = line.length;
      continue;
    }

    // Python decorators
    if (lang === 'python' && ch === '@' && /^@\w/.test(rest)) {
      flush();
      const m = rest.match(/^@[\w.]+/);
      if (m) { addToken(m[0], 'decorator'); i += m[0].length; continue; }
    }

    // Rust macros and attributes
    if (lang === 'rust') {
      if (rest.startsWith('#[') || rest.startsWith('#![')) {
        flush();
        const end = line.indexOf(']', i);
        const attrEnd = end >= 0 ? end + 1 : line.length;
        addToken(line.substring(i, attrEnd), 'decorator');
        i = attrEnd;
        continue;
      }
      // Macro invocations
      const macroMatch = rest.match(/^(\w+)!/);
      if (macroMatch) {
        flush();
        addToken(macroMatch[1] + '!', 'builtin');
        i += macroMatch[0].length;
        continue;
      }
    }

    // Strings
    if (ch === '"' || ch === "'" || ch === '`') {
      flush();
      let end = i + 1;
      // Triple quotes in Python
      if (lang === 'python' && (rest.startsWith('"""') || rest.startsWith("'''"))) {
        const quote3 = rest.substring(0, 3);
        end = line.indexOf(quote3, i + 3);
        end = end >= 0 ? end + 3 : line.length;
        addToken(line.substring(i, end), 'string');
        i = end;
        continue;
      }
      while (end < line.length) {
        if (line[end] === '\\') { end += 2; continue; }
        if (line[end] === ch) { end++; break; }
        end++;
      }
      addToken(line.substring(i, end), 'string');
      i = end;
      continue;
    }

    // Numbers
    if (/\d/.test(ch) && (i === 0 || !/[\w]/.test(line[i - 1]))) {
      flush();
      const numMatch = rest.match(/^0[xX][0-9a-fA-F_]+|^0[bB][01_]+|^0[oO][0-7_]+|^\d[\d_]*\.?\d*(?:[eE][+-]?\d+)?[fFdDlLuU]*/);
      if (numMatch) {
        addToken(numMatch[0], 'number');
        i += numMatch[0].length;
        continue;
      }
    }

    // Identifiers
    if (/[a-zA-Z_$]/.test(ch)) {
      flush();
      const idMatch = rest.match(/^[a-zA-Z_$][\w$]*/);
      if (idMatch) {
        const word = idMatch[0];
        if (keywords.has(word)) {
          addToken(word, 'keyword');
        } else if (builtins.has(word)) {
          addToken(word, 'builtin');
        } else if (types.has(word)) {
          addToken(word, 'type');
        } else if (/^[A-Z][A-Z_0-9]+$/.test(word)) {
          addToken(word, 'constant');
        } else if (/^[A-Z]/.test(word) && lang !== 'css') {
          addToken(word, 'type');
        } else if (i + word.length < line.length && line[i + word.length] === '(') {
          addToken(word, 'function');
        } else {
          addToken(word, 'variable');
        }
        i += word.length;
        continue;
      }
    }

    // CSS specific: properties, selectors, values
    if (lang === 'css') {
      if (ch === ':') { flush(); addToken(':', 'operator'); i++; continue; }
      if (ch === '{' || ch === '}' || ch === ';') { flush(); addToken(ch, 'punctuation'); i++; continue; }
      if (ch === '.' || ch === '#') {
        flush();
        const selMatch = rest.match(/^[.#][\w-]+/);
        if (selMatch) { addToken(selMatch[0], 'tag'); i += selMatch[0].length; continue; }
      }
    }

    // Operators
    if (/[+\-*/%=<>!&|^~?:]/.test(ch)) {
      flush();
      const opMatch = rest.match(/^(?:===|!==|==|!=|<=|>=|&&|\|\||<<|>>|>>>|\?\?|\?\.|\.\.\.|=>|\*\*|[+\-*/%=<>!&|^~?:])/);
      if (opMatch) { addToken(opMatch[0], 'operator'); i += opMatch[0].length; continue; }
    }

    // Punctuation
    if (/[{}()\[\];,.]/.test(ch)) {
      flush();
      addToken(ch, 'punctuation');
      i++;
      continue;
    }

    current += ch;
    i++;
  }

  flush();
  return tokens;
}

// Map token types to CSS color classes
export function tokenColor(type: Token['type']): string {
  switch (type) {
    case 'keyword': return '#569cd6';
    case 'string': return '#ce9178';
    case 'comment': return '#6a9955';
    case 'number': return '#b5cea8';
    case 'operator': return '#d4d4d4';
    case 'function': return '#dcdcaa';
    case 'type': return '#4ec9b0';
    case 'variable': return '#9cdcfe';
    case 'property': return '#9cdcfe';
    case 'tag': return '#569cd6';
    case 'attribute': return '#9cdcfe';
    case 'punctuation': return '#808080';
    case 'decorator': return '#d7ba7d';
    case 'builtin': return '#4fc1ff';
    case 'constant': return '#4fc1ff';
    case 'namespace': return '#4ec9b0';
    case 'plain': return '#d4d4d4';
    default: return '#d4d4d4';
  }
}
