import sys
import locale

print("기본 인코딩:", sys.getdefaultencoding())
print("파일시스템 인코딩:", sys.getfilesystemencoding())
print("stdin 인코딩:", sys.stdin.encoding)
print("stdout 인코딩:", sys.stdout.encoding)
print("로케일:", locale.getpreferredencoding())