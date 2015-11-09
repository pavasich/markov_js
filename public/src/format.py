import re

f = open("/home/pavasich/Downloads/genres.list", 'r')

text = f.readlines()
f.close()

text = text[380:]
ls = []
d = {}
regex = re.compile('\([0-9]+.*\)|"|{|}|\(TV\)|\(V\)|\(VG\)|\(\?+.*\)|(SUSPENDED)')
for line in text:
    if "Sci-Fi" in line:
        line = line.strip('\t')
        line = regex.sub('',line)
        line = line.split()[:-1]
        if len(line) > 1 and line[0] != 'Untitled':
            line = ' '.join(line)
            try:
                x = d[line]
                #print 'skipped',line
            except:
                d[line] = True;

with open('sci-fi.txt', 'w') as f:
    for key in d:
        f.write(key+'\n')
    f.close()
    
print "Done"
