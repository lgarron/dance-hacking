/*
 * lgwav2png.c
 * Lucas Garron
 * lucasg@gmx.de
 *
 * Started May 31, 2010
 * 
 * Intended to be a tool to generate pretty waveform images
 * from sound files.
 *
 * Based on the specification at
 * https://ccrma.stanford.edu/courses/422/projects/WaveFormat/
 */

/*
 * TODO:
 * File error handling
 * Debug output optional
 * Assert checks optional
 */

#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <math.h>

#include "lgpng.h"
#include "lgwav.h"


#define VERSION "0.1.1"
#define PRINT_DIVISION "---------------------------------\n"

static int DEBUGLEVEL = 0;
#define DPRINTF if(DEBUGLEVEL>5)printf

int DEFAULT_STYLE = 1;
int MAX_STYLE = 6;


void print_greeting()
{
  printf(PRINT_DIVISION);
	printf("Welcome to lgwav2png!\n");
  printf("By Lucas Garron, version %s\n", VERSION);
  /*printf("Stated May 31, 2010\n");*/
}


void print_help()
{
	printf(PRINT_DIVISION);
	printf("lgwav2png will take a raw WAV file and output a (large) PNG file:\n");
	printf("./lgwav2png -i soundfile.wav\n");
	printf("\n");
	printf("Options:\n");
	printf("\n");
	printf("-i Input file\n");
	printf("-o Output file (Default is [-i filename].png)\n");
	printf("-W Image width\n");
	printf("-H Image height\n");
	printf("-h Display help\n");
	printf("-s Style; currently 1 to 6\n\n");
}

typedef struct waveform_data {
	struct wave* w;
	int width;
	int ch0_max;
	int ch1_max;
	int* upper_array;
	int* lower_array;
} wave_form_image_data;

struct waveform_data* waveform_data_alloc(struct wave* w, int width) {
	struct waveform_data* d;
	d = malloc(sizeof(struct waveform_data));
	d->w = w;
	d->width = width;
	d->ch0_max = 0;
	d->ch1_max = 0;
	d->upper_array = calloc(width, sizeof(int));
	d->lower_array = calloc(width, sizeof(int));
	return d;
}

int waveform_data_free(struct waveform_data* d) {
	free(d->upper_array);
	free(d->lower_array);
	free(d);
	return 0;
}

int jth_height_max(struct waveform_data* d, int channel, int j) {
	int index_from;
	int index_to;
	int i, max;
	
	index_from = (d->w->numSamples)/(d->width)*j;
	index_to = (d->w->numSamples)/(d->width)*(j+1);
	
	max = 0;
	for (i=index_from; i<index_to; i++) {
		max = MAX(max, ABS(sample_at(d->w, channel, i)));
	}
	
	return max;
}

int compare_int (const void * a, const void * b)
{
  return ( *(int*)a - *(int*)b );
}

int jth_height_percentile(struct waveform_data* d, int channel, int j) {
	int index_from;
	int index_to;
	int i;
	int height;
	int arr_size;
	int* arr;
	int SKIP;
	
	SKIP = 16;
	
	index_from = (d->w->numSamples)/(d->width)*(MAX(j-2, 0));
	index_to = (d->w->numSamples)/(d->width)*(MIN(j+1+2, d->width));
	
	arr_size = (index_to-index_from)/SKIP;
	arr = malloc(sizeof(int)*(arr_size));
	
	for (i=0; i<arr_size; i++) {
		arr[i] = ABS(sample_at(d->w, channel, i*SKIP+index_from));
	}
	
	qsort(arr, arr_size, sizeof(int), compare_int);
	
	height = arr[(arr_size)*3/4];
	
	free(arr);
	
	return height;
}

/* To-do: somehow combine with jth_height_percentile(...) */
int overall_height_percentile(int* data, int len, int num, int denom) {
	int index_from;
	int index_to;
	int i;
	int height;
	int arr_size;
	int* arr;
	
	index_from = 0;
	index_to = len;
	
	arr_size = index_to-index_from;
	arr = malloc(sizeof(int)*(arr_size));
	
	for (i=0; i<arr_size; i++) {
		arr[i] = data[i];
	}
	
	qsort(arr, arr_size, sizeof(int), compare_int);
	
	height = arr[MIN(MAX((arr_size)*num/denom, 0), arr_size-1)];
	
	free(arr);
	
	return height;
}

typedef struct counter {
	int max;
	int lastlen;
} counter;

void backspace_n_times(int n)
{
	int i;
	
	for(i=0; i < n; i++) {
		printf("\b");
	}
}

void counter_update(struct counter* c, int num)
{
	backspace_n_times(c->lastlen);
	
	c->lastlen = printf("%d/%d", num, c->max);
	fflush(stdout);
}

struct counter* counter_alloc(int max)
{
	struct counter* c = malloc(sizeof(struct counter));
	
	c->max = max;
	counter_update(c, 0);
	
	return c;
}

int counter_finish_and_free(struct counter* c)
{
	printf(" - Done!\n");
	free(c);
	return 0;
}

struct waveform_data* compute_waveform(struct wave* w, int width)
{
	int j;
	int ch0, ch1;
	struct waveform_data* d;
	
	struct counter* c;
	
	d = waveform_data_alloc(w, width);
	
	c = counter_alloc(d->width);
	
	
	for (j=0; j<(d->width); j++) {
		counter_update(c, j+1);
		ch0 = jth_height_percentile(d, 0, j);
		ch1 = jth_height_percentile(d, 1, j);
		
		d->upper_array[j] = ch0;
		d->ch0_max = MAX(d->ch0_max, ch0);
		d->lower_array[j] = ch1;
		d->ch1_max = MAX(d->ch1_max, ch1);
	}		
	
	counter_finish_and_free(c);
	
	/*
	 d->ch0_max = d->ch0_max*4/5;
	 d->ch1_max = d->ch1_max*4/5;
	 */
	
	d->ch0_max = overall_height_percentile(d->upper_array, d->width, 9, 10)*5/4;
	d->ch1_max = overall_height_percentile(d->lower_array, d->width, 9, 10)*5/4;
	
	
	d->ch0_max = MAX(d->ch0_max, d->ch1_max);
	d->ch1_max = MAX(d->ch0_max, d->ch1_max);
	
	return d;
}

int draw_waveform(struct wave* w, struct image* img, int style)
{
	int middle, upward, downward;
	int j, i;
	int ch0, ch1;
	struct waveform_data* d;
	
	middle = (img->height)/2;
	upward = (img->height)/2;
	downward = (img->height)/2;
	
	d = compute_waveform(w, img->width);
	
	
	/* These cases are ugly, but it's not much prettier to unify them. */
	
	if(style == 1) {	
		
		for (j=0; j<(img->width); j++) {
			
			/* Should probably scale by max and median out. */
			ch0 = d->upper_array[j]*upward/(d->ch0_max);
			ch1 = d->lower_array[j]*downward/(d->ch1_max);
			
			for (i=0; i<ch0; i++) {
				pixel_at(img, MAX(middle-i-1, 0), j)->b = 255;
				pixel_at(img, MAX(middle-i-1, 0), j)->a = 255-i*255/ch0;
			}
			
			for (i=0; i<ch1; i++) {
				pixel_at(img, MIN(middle+i, (img->height)-1), j)->r = 255;
				pixel_at(img, MIN(middle+i, (img->height)-1), j)->a = 255-i*255/ch1;
			}
		}
		
	}
	
	
	if(style == 2) {	
		
		
		for (i=0; i<(img->height); i++) {
			for (j=0; j<(img->width); j++) {
				pixel_at(img, i, j)->r = 222;
				pixel_at(img, i, j)->g = 240;
				pixel_at(img, i, j)->b = 255;
				pixel_at(img, i, j)->a = 255;
			}
		}
		
		for (j=0; j<(img->width); j++) {
			
			double fading = 0.7;
			
			/* Should probably scale by max and median out. */
			ch0 = d->upper_array[j]*upward/(d->ch0_max);
			ch1 = d->lower_array[j]*downward/(d->ch1_max);
			
			for (i=0; i<ch0; i++) {
				pixel_at(img, MAX(middle-i-1, 0), j)->r = pow(i, fading)*pow(ch0, 1-fading)*222/ch0;
				pixel_at(img, MAX(middle-i-1, 0), j)->g = pow(i, fading)*pow(ch0, 1-fading)*240/ch0;
				pixel_at(img, MAX(middle-i-1, 0), j)->b = 255;
				pixel_at(img, MAX(middle-i-1, 0), j)->a = 255;
			}
			
			for (i=0; i<ch1; i++) {
				pixel_at(img, MIN(middle+i, (img->height)-1), j)->r = pow(i, fading)*pow(ch1, 1-fading)*222/ch1;
				pixel_at(img, MIN(middle+i, (img->height)-1), j)->g = pow(i, fading)*pow(ch1, 1-fading)*240/ch1;
				pixel_at(img, MIN(middle+i, (img->height)-1), j)->b = 255;
				pixel_at(img, MIN(middle+i, (img->height)-1), j)->a = 255;
			}
		}
		
	}
	
	
	if(style == 3) {	
		
		for (j=0; j<img->width; j++) {
			for (i=0; i<(img->height)/2; i++) {
				set_pixel_at(img, i, j, 222, 240, 255, 255);
			}
			for (i=(img->height)/2; i<(img->height); i++) {
				set_pixel_at(img, i, j, 255, 127, 0, 255);
			}
		}
		
		for (j=0; j<(img->width); j++) {
			
			double fading = 0.7;
			
			/* Should probably scale by max and median out. */
			ch0 = d->upper_array[j]*upward/(d->ch0_max);
			ch1 = d->lower_array[j]*downward/(d->ch1_max);
			
			fading = 0.5;
			for (i=0; i<ch0; i++) {
				pixel_at(img, MAX(middle-i-1, 0), j)->r = pow(i, fading)*pow(ch0, 1-fading)*222/ch0;
				pixel_at(img, MAX(middle-i-1, 0), j)->g = pow(i, fading)*pow(ch0, 1-fading)*240/ch0;
				pixel_at(img, MAX(middle-i-1, 0), j)->b = 127+pow(i, fading)*pow(ch0, 1-fading)*128/ch0;
				pixel_at(img, MAX(middle-i-1, 0), j)->a = 255;
			}
			
			fading = 0.7;
			for (i=0; i<ch1; i++) {
				pixel_at(img, MIN(middle+i, (img->height)-1), j)->r = 127+pow(i, fading)*pow(ch1, 1-fading)*128/ch1;
				pixel_at(img, MIN(middle+i, (img->height)-1), j)->g = pow(i, fading)*pow(ch1, 1-fading)*127/ch1;
				pixel_at(img, MIN(middle+i, (img->height)-1), j)->b = 000;
				pixel_at(img, MIN(middle+i, (img->height)-1), j)->a = 255;
			}
		}
		
	}
	
	
	if(style == 4) {	
		
		for (j=0; j<img->width; j++) {
			for (i=0; i<(img->height)/2; i++) {
				set_pixel_at(img, i, j, 222, 240, 255, 255);
			}
			for (i=(img->height)/2; i<(img->height); i++) {
				set_pixel_at(img, i, j, 0, 0, 127, 255);
			}
		}
		
		for (j=0; j<(img->width); j++) {
			
			double fading = 0.7;
			
			/* Should probably scale by max and median out. */
			ch0 = d->upper_array[j]*upward/(d->ch0_max);
			ch1 = d->lower_array[j]*downward/(d->ch1_max);
			
			for (i=0; i<ch0; i++) {
				pixel_at(img, MAX(middle-i-1, 0), j)->r = pow(i, fading)*pow(ch0, 1-fading)*222/ch0;
				pixel_at(img, MAX(middle-i-1, 0), j)->g = pow(i, fading)*pow(ch0, 1-fading)*240/ch0;
				pixel_at(img, MAX(middle-i-1, 0), j)->b = 127+pow(i, fading)*pow(ch0, 1-fading)*128/ch0;
				pixel_at(img, MAX(middle-i-1, 0), j)->a = 255;
			}
			
			for (i=0; i<ch1; i++) {
				pixel_at(img, MIN(middle+i, (img->height)-1), j)->r = 222-pow(i, fading)*pow(ch1, 1-fading)*222/ch1;
				pixel_at(img, MIN(middle+i, (img->height)-1), j)->g = 240-pow(i, fading)*pow(ch1, 1-fading)*240/ch1;
				pixel_at(img, MIN(middle+i, (img->height)-1), j)->b = 255-pow(i, fading)*pow(ch1, 1-fading)*128/ch1;
				pixel_at(img, MIN(middle+i, (img->height)-1), j)->a = 255;
			}
		}
		
	}
	
	
	if(style == 5) {	
		
		for (j=0; j<img->width; j++) {
			for (i=0; i<(img->height)/2; i++) {
				set_pixel_at(img, i, j, 0, 0, 127, 255);
			}
			for (i=(img->height)/2; i<(img->height); i++) {
				set_pixel_at(img, i, j, 0, 0, 127, 255);
			}
		}
		
		for (j=0; j<(img->width); j++) {
			
			double fading = 0.8;
			
			/* Should probably scale by max and median out. */
			ch0 = d->upper_array[j]*upward/(d->ch0_max);
			ch1 = d->lower_array[j]*downward/(d->ch1_max);
			
			for (i=0; i<ch0; i++) {
				pixel_at(img, MAX(middle-i-1, 0), j)->r = 222-pow(i, fading)*pow(ch0, 1-fading)*222/ch0;
				pixel_at(img, MAX(middle-i-1, 0), j)->g = 240-pow(i, fading)*pow(ch0, 1-fading)*240/ch0;
				pixel_at(img, MAX(middle-i-1, 0), j)->b = 255-pow(i, fading)*pow(ch0, 1-fading)*128/ch0;
				pixel_at(img, MAX(middle-i-1, 0), j)->a = 255;
			}
			
			for (i=0; i<ch1; i++) {
				pixel_at(img, MIN(middle+i, (img->height)-1), j)->r = 222-pow(i, fading)*pow(ch1, 1-fading)*222/ch1;
				pixel_at(img, MIN(middle+i, (img->height)-1), j)->g = 240-pow(i, fading)*pow(ch1, 1-fading)*240/ch1;
				pixel_at(img, MIN(middle+i, (img->height)-1), j)->b = 255-pow(i, fading)*pow(ch1, 1-fading)*128/ch1;
				pixel_at(img, MIN(middle+i, (img->height)-1), j)->a = 255;
			}
		}
		
	}
	
	
	
	if(style == 6) {	
		
		for (j=0; j<img->width; j++) {
			for (i=0; i<(img->height)/2; i++) {
				set_pixel_at(img, i, j, 222, 240, 255, 255);
			}
			for (i=(img->height)/2; i<(img->height); i++) {
				set_pixel_at(img, i, j, 222, 240, 255, 255);
			}
		}
		
		for (j=0; j<(img->width); j++) {
			
			double fading = 0.5;
			
			/* Should probably scale by max and median out. */
			ch0 = d->upper_array[j]*upward/(d->ch0_max);
			ch1 = d->lower_array[j]*downward/(d->ch1_max);
			
			for (i=0; i<ch0; i++) {
				pixel_at(img, MAX(middle-i-1, 0), j)->r = pow(i, fading)*pow(ch0, 1-fading)*222/ch0;
				pixel_at(img, MAX(middle-i-1, 0), j)->g = pow(i, fading)*pow(ch0, 1-fading)*240/ch0;
				pixel_at(img, MAX(middle-i-1, 0), j)->b = 127+pow(i, fading)*pow(ch0, 1-fading)*128/ch0;
				pixel_at(img, MAX(middle-i-1, 0), j)->a = 255;
			}
			
			for (i=0; i<ch1; i++) {
				pixel_at(img, MIN(middle+i, (img->height)-1), j)->r = pow(i, fading)*pow(ch1, 1-fading)*222/ch1;
				pixel_at(img, MIN(middle+i, (img->height)-1), j)->g = pow(i, fading)*pow(ch1, 1-fading)*240/ch1;
				pixel_at(img, MIN(middle+i, (img->height)-1), j)->b = 127+pow(i, fading)*pow(ch1, 1-fading)*128/ch1;
				pixel_at(img, MIN(middle+i, (img->height)-1), j)->a = 255;
			}
		}
	}
	
	
	waveform_data_free(d);
	
	return 0;
}

int main(int argc, char* argv[])
{
	struct wave* w;
	struct image* img;
	int width, height;
	char* in_file_name;
	char* out_file_name;
	FILE* file;
	int style = DEFAULT_STYLE;
	
	/* Options */
	int c;
	opterr = 0;
	
	print_greeting();
	
	/* Defaults */
	width = 1024;
	height = 256;
	in_file_name = "";
	out_file_name = "";
	
	while ((c = getopt (argc, argv, "W:H:hi:o:s:")) != -1)
		switch (c)
	{
		case 'W':
			width = atoi(optarg);
			DPRINTF("Width set to %d\n", width);
			break;
		case 'H':
			height = atoi(optarg);
			DPRINTF("Height set to %d\n", height);
			break;
		case 'h':
			print_help();
			return 0;
			break;
		case 'i':
			in_file_name = optarg;
			break;
		case 'o':
			out_file_name = optarg;
			break;
		case 's':
			style = MIN(MAX(atoi(optarg), 1), MAX_STYLE);
			printf("Style set to %d\n", style);
			break;
		case '?':
			fprintf (stderr, "Unknown option `-%c'.\n", optopt);
			return 1;
		default:
			abort();
	}
	
	if (argc == 1) {
		print_help();
		return 0;
	}
	
	w = ini_wave(in_file_name);
	assert(w!=NULL);
	
	DPRINTF(PRINT_DIVISION);
	DPRINTF("We seem to have a valid WAVE file!\n");
	
	/* Create image. Note width first.*/
	img = image_alloc(width, height);
	
	draw_waveform(w, img, style);
	
	/* Output where? */
	if (strlen(out_file_name) == 0) {
		asprintf(&out_file_name, "%s.png", in_file_name); /* Small leak; avoiding it would be a bit messy. */
	}
	
	/* Open */
	printf("Writing to file %s\n", out_file_name);
	file = fopen(out_file_name, "w");
	assert(file != NULL);
	
	/* Write */
	write_PNG_image_to_file(file, img);
	
	/* Close */
	image_free(img);
	fclose(file);
	
	cleanup_wave(w);
	free(w);
	
	return 0;
}
