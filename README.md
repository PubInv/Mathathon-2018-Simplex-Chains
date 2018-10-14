# Public Invention Mathathon 2018

This repo holds information defining open problems, and hopefully solutions to them, for the
Nov. 30th through Dec. 2nd, free of charge, free-libre all-virtual [mathathon/hackathon](https://www.eventbrite.com/e/mathathon-a-cooperative-virtual-mathathon-tickets-50181898409)
hosted by Public Invention.

## Usage of the Software

We have written a [web page](https://pubinv.github.io/Mathathon-2018-Simplex-Chains/platforms/index.html) for testing interactively
testing the easiest class of problems: building chains of equilateral triangles.
We call instructions for building such a chain is called a **2D simplex generator**.

The page allows you to dynamically load a JavaScript function which can generate
a simplex chain made of equilateral triangles joined edge-to-edge.

The JavaScript function takes a natural number (starting at 0) and tells which edge of the
last triangle in the chain the next triangle should be joined to. These edges are simply
named "L" and "R" for left and right. The string "S" is returned when it is time to stop.
Every chain starts with one triangle.

As an example, consider this JavaScript function which generates a **beam** or **ladder**.

```
(n) => { return ((n < 10) ? (((n % 2) == 0) ? "L" : "R" ): "S"); }
```

By turning left and then right, a straight "ladder" is constructed.
This is one of the simpler generators.

A number of sample generators can be selected, but the goal is to write your own!
Play around and see what you can create. For example, can you write a generator
that fills all space? If you find a good generator, make a pull request or just
place it in an issue and we will add it to our library of sample generators.

## Motivation and More Math

To understand why problems like this, and in particular 3D versions of these
problems are valuable to mechanical engineers and robotocists, you may want
to read our [technical article](https://github.com/PubInv/Mathathon-2018-Simplex-Chains/blob/master/SimplexChains.pdf) that also lists many of the open problems that will be addressed
by the mathathon.

## Improvements

The purpose of the mathathon is to foster cooperation, not competition. We welcome cooperation
in making this repo more fun, and in getting ready for the Mathathon. All sorts of
suggestions are welcome.

With respect to the current [experimentation page](https://pubinv.github.io/Mathathon-2018-Simplex-Chains/platforms/index.html),
we would like to:
* Allow the grid size to be controlled (in particular, increased.)
* The starting point and direction could be better specified.
* A system for evaluating how closely a simplex chain matches and geometric curve
would be very useful.
* A system for grading specific problems, such as space-filling or creating a
logarithmic spiral, would be fun.
* Expanding the library of generators is always valuable.
* Is there a more elegant and powerful way to program generators? (For example,
could we create subroutines for turns and straight lines?)
* Can we build a set of evalutions, such as if a generator is periodic, or closed,
or unbounded, or minimal?

## Open Problems

In an attempt to make that Mathathon serious and seriously fun we have defined a
large set of **open problems** tagged with particular numbers.
You can find these in our [pdf](https://github.com/PubInv/Mathathon-2018-Simplex-Chains/blob/master/SimplexChains.pdf). Precisely defining interesting problems is a major part of this
effort; if you can suggest a problem, please send it to us in an issue.

## License

All code is this repo is licensced under the GNU General Public License (v3). Non-code assets
are licensed under the Creative Commons Share Alike-By Attribution (v4) license.
