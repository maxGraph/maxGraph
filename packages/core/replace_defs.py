import re
import json
from pathlib import Path


with open('typed_mxgraph_defs.json', 'r', encoding='utf-8') as f:
    defs = json.loads(f.read())


for path in list(Path('.').rglob('./*/*.js')) + list(Path('.').rglob('./*/*.ts')):
    print(path)
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    clsname = path.name.split('.')[0]
    if clsname in defs:
        #print(defs[clsname])
        assert not '\r\n' in text

        if defs[clsname][0]:
            pattern = r'(/\*(?:(?!\*/).)*\*/)\s*\nclass %s\b' % clsname
            replace_with = '\n'.join(defs[clsname][0])
            replace_with += '\nclass %s' % clsname
            replace_with = replace_with.replace('\\u', '').replace('\\x', '')
            text = re.sub(pattern, replace_with, text, flags=re.DOTALL)

        for k, v in defs[clsname][1].items():
            if not v[1]: continue
            elif not k.strip().strip('();'): continue
            k = k.strip('\\;')

            pattern = r'  (/\*(?:(?!\*/).)*\*/)\n  %s\b' % k
            replace_with = '\n'.join('  '+i for i in v[1])
            replace_with += '\n  // '+v[0]+'\n'
            replace_with += '  %s' % k
            replace_with = replace_with.replace('\\u', '').replace('\\x', '')

            #print(pattern, re.findall(pattern, text, re.DOTALL))
            text = re.sub(pattern, replace_with, text, flags=re.DOTALL)

        print(text)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)




