import std.stdio;

class SummedAreaTable(E) {

private:
    E[] data;
    const int stride, width, height;

public:
    this(int width, int height, E function(int, int) calc) {
        data = new E[width * height];
        stride = width;
        this.width = width;
        this.height = height;

        this[0,0] = calc(0, 0);
        
        for (auto i = 1; i < width; ++i) {
            this[i,0] = this[i-1,0] + calc(i, 0);
        }

        for (auto j = 1; j < height; ++j) {
            this[0,j] = this[0,j-1] + calc(0, j);
        }

        for (auto j = 1; j < height; ++j) {
            for (auto i = 1; i < width; ++i) {
                this[i,j] = this[i-1,j] + this[i,j-1] - this[i-1,j-1] + calc(i,j);
            }
        }
    }

    /**
     * Calculates the summed area of the rectangular region denoted by
     * the parameters.
     */
    E calc(int x, int y, int width, int height)
    in {
        assert(x >= 0 && x < this.width);
        assert(y >= 0 && y < this.height);
        assert(width >= 1 && (x + width) <= this.width);
        assert(height >= 1 && (y + height) <= this.height);
    }
    body {
        return this[x+width-1,y+height-1] - (this[x+width-1,y-1] + this[x-1,y+height-1]) + this[x-1,y-1];
    }

private:    
    ref E opIndex(int i, int j) { return data[(stride * j) + i]; }
}

alias SATInt = SummedAreaTable!int;

void main()
{
    auto sat = new SATInt(10, 10, &test);
    stdout.writeln(sat.calc(1, 3, 4, 4));
}

int test(int i, int j) {
    return i * j;
}