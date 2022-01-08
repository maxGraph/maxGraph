import re
from pathlib import Path

MODE_BETWEEN_COMMENTS = 0
MODE_COMMENT_START = 1
MODE_PARAMS_START = 2

for path in Path('.').rglob('*.js'):
    out_lines = []
    cur_mode = MODE_BETWEEN_COMMENTS
    
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip() == '/**' and cur_mode == MODE_BETWEEN_COMMENTS:
                cur_mode = MODE_COMMENT_START
                out_lines.append(line)
            elif line.strip() == '* Parameters:' and cur_mode == MODE_COMMENT_START:
                cur_mode = MODE_PARAMS_START
            elif cur_mode == MODE_PARAMS_START:
                if line.strip() == '*/':
                    cur_mode = MODE_BETWEEN_COMMENTS
                    out_lines.append(line)
                elif line.strip() != '*':
                    # e.g. * node - DOM node whose siblings should be removed.
                    line = re.sub(r'(\s*?)\* ([A-z0-9_]+) - ', '\\1* @param \\2 ', line)
                    #print(line)
                    out_lines.append(line)
            else:
                out_lines.append(line)
    
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(''.join(out_lines))
