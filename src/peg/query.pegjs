start = expr;

AND = 'and';
OR = 'or';
NOT = 'not';
APPROXIMATELY = '=~';
REGEX_MATCH = '~=';
NOT_EQUAL = '!=';
EQUAL = '=';
LESSER = '<';
LESSER_EQUAL = '<=';
GREATER = '>';
GREATER_EQUAL = '>=';
TAGGED = 'tagged';

field = 
    'host'        /
    'service'     /
    'state'       /
    'description' /
    'metric_f'    /
    'metric'      /
    'ttl'         /
    'time'

WS =  
    ' '  /
    '\t' /
    '\r' /
    '\n'    

value = t / f / nil / NUMBER / String;

t   =   'true';
f   =   'false';
nil =   'null' / 'nil';

NUMBER = FLOAT / INT
INT =   sign:'-'? d:[0-9]+ { sign = sign || ''; return parseInt(sign + d.join(''));  }
FLOAT =   sign:'-'? a:([0-9]+) b:('.' [0-9]*) c:EXPONENT? { sign = sign || ''; return parseFloat(sign + a.join('') + b.join('') + c);  }
EXPONENT = ('e'/'E') ('+'/'-')? [0-9]+ ;

String = '"'chars:([^\\"])*'"' { return chars.join(''); }

approximately_expr = field WS* APPROXIMATELY WS* value;
regex_match_expr =   field WS* REGEX_MATCH WS* value;
lesser_expr  =   field WS* LESSER WS* value;
lesser_equal_expr =   field WS* LESSER_EQUAL WS* value;
greater_expr =   field WS* GREATER WS* value;
greater_equal_expr = field WS* GREATER_EQUAL WS* value;
not_equal_expr = field WS* NOT_EQUAL WS* value; 
equal_expr =  field WS* EQUAL WS* value;
tagged_expr =  TAGGED WS* String;

expr = or_expr;
or_expr = and_expr (WS* OR WS* and_expr)*;
and_expr = (not_expr / primary) (WS* AND WS* (not_expr / primary))*;
not_expr = NOT WS* (not_expr / primary);

primary = (('(' or_expr ')') (or_expr) / fragment);

fragment = 
    t /
    f /
    nil /
    approximately_expr /
    regex_match_expr /
    lesser_expr /
    lesser_equal_expr /
    greater_expr /
    greater_equal_expr /
    not_equal_expr /
    equal_expr /
    tagged_expr