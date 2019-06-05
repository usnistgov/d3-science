SRC = $(wildcard src/*.js)
LIB = $(SRC:src/%.js=lib/%.js)
BABEL = ./node_modules/.bin/babel

all: lib $(LIB)

clean: 
	rm lib/*.js

lib: 
	mkdir -p $(@D)

lib/%.js: src/%.js .babelrc
	$(BABEL) $< -o $@
