SRC = $(wildcard src/*.js)
LIB = $(SRC:src/%.js=lib/%.js)

all: lib $(LIB)

clean: 
	rm lib/*.js

lib: 
	mkdir -p $(@D)

lib/%.js: src/%.js .babelrc
	babel $< -o $@
