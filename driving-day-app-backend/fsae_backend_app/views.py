from django.http import JsonResponse, Http404
from .ld_parser.main import process_and_upload_inputted_ld_file
import json
from .firebase.firestore import *
from asgiref.sync import sync_to_async
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from django.middleware.csrf import get_token
from django.conf import settings
from .aws import upload_to_s3, get_s3_client, delete_s3_folder
from botocore.exceptions import ClientError

@ensure_csrf_cookie
@require_GET
def get_csrf_token(request):
    token = get_token(request)
    return JsonResponse({"csrfToken": token})


def homepage():
    return JsonResponse({
        "message": "Welcome to the FSAE Backend!",
        "status": "success"
    })


@require_POST
async def add_driver_call(request):
    """
    Handles user registration via a POST request.

    This endpoint allows a new user to create and register an account on the platform.
    The request must contain the necessary user details (e.g., username, password, 
    email) in the request body. Upon successful registration, it returns a JSON response 
    with a success message. If the request method is not POST, it returns an error message.

    Methods:
    - POST: Register a new user with the provided data.

    Returns:
    - JSON response with a success message if the registration is successful.
    - JSON response with an error message if the request method is not POST.
    """
    try:
        data = json.loads(request.body.decode('utf-8'))
        await sync_to_async(add_driver)(data)
        return JsonResponse({"message": "User registration successful!"}, status=200)
    except Exception as e:
        return JsonResponse({"error": f"An unexpected error occurred: {str(e)}"}, status=500)
    

@require_GET
async def get_all_drivers_call(request):
    """
    Get all drivers with optional height/weight filtering
    """
    try:
        height = request.GET.get('height')
        weight = request.GET.get('weight')
        
        filters = {}
        if int(height) != -1:
            filters['height'] = float(height)
        if int(weight) != -1:
            filters['weight'] = float(weight)
        
        get_all_drivers_async = sync_to_async(get_all_drivers)

        drivers = await get_all_drivers_async(filters=filters if filters else None)

        return JsonResponse({
            "drivers": drivers,
            "message": "Drivers retrieved successfully"
        }, status=200)
        
    except Exception as e:
        return JsonResponse({
            "error": str(e),
            "message": "Error retrieving drivers"
        }, status=400)


@require_GET
async def get_specific_driver_call(request):
    """
    Returns specific driver data based on an inputted driver ID.

    Methods:
    - GET: Return driver data based on the inputted driver ID

    Returns:
    - JSON response of a driver based on the inputted driver ID
    """
    try:
        driverId = request.GET.get('driverId')

        curr_driver = await sync_to_async(get_specific_driver)(driverId)

        return JsonResponse({
            "driver": curr_driver,
            "message": "Drivers retrieved successfully"
        }, status=200)
        
    except Exception as e:
        return JsonResponse({
            "error": str(e),
            "message": "Error retrieving drivers"
        }, status=400)


@require_POST
@csrf_exempt
async def upload_files_call(request):
    """
    Handle the POST request to upload and process LD files.

    This view function processes LD files from the specified input directory, converts
    them into DataFrames, and saves the resulting data as CSV files in the output directory.
    After saving, each CSV file is uploaded to Firestore for further use.

    Request Method:
        POST: Triggers the `process_and_upload_inputted_ld_files` function to convert and upload
        all LD files in the input directory. 

    Returns:
        JsonResponse: A JSON response indicating success or failure of the upload process.
        - On Success: Returns a JSON message with HTTP 200 status indicating that the data upload
          was successful.
        - On Failure: Returns an error message with HTTP 400 status if a non-POST request is made.

    Example:
        POST /api/upload-files/ -> Triggers the upload process and returns success status.

    """
    try:
        # Pull Metadata:
        all_files = request.FILES

        data_file = all_files.get('dataFile')
        media_files = list(all_files.keys())
        media_files.pop(0)

        # Driver ID
        driver_id = request.POST.get('driverId')
        # Run Date
        run_date=request.POST.get('runDate')
        # Title for Run
        run_title = request.POST.get('runTitle')

        # Upload to S3
        # Obtain Image URLs:
        await sync_to_async(process_and_upload_inputted_ld_file)(data_file, run_date, run_title, driver_id)
        return JsonResponse({"message": "Successfully uploaded LD data to database!"}, status=200)
    except Exception as e:
        return JsonResponse({"error": f"An unexpected error occurred: {str(e)}"}, status=500)


@require_POST
@csrf_exempt
def upload_s3_image_call(request):
    """
    Upload a single image to S3 using multipart/form-data.
    Expects:
      - 'image' file field
      - 'id' form field
    """
    image_file = request.FILES.get("file")
    image_id   = request.POST.get("issue_id")
    
    if not image_file or not image_id:
        return JsonResponse(
            {"error": "Missing 'image' file or 'id' field."},
            status=400
        )

    s3_key = f"issues/{image_id}/{image_file.name}"
    try:
        # synchronous upload
        upload_to_s3(image_file, s3_key, settings.AWS_STORAGE_BUCKET_NAME)
    except Exception as e:
        return JsonResponse(
            {"error": f"Failed to upload image to S3: {e}"},
            status=500
        )

    file_url = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{s3_key}"
    return JsonResponse(
        {
            "message":  "File uploaded successfully!",
            "file_url": file_url,
            "issue_id": image_id
        },
        status=201
    )

@require_GET
def fetch_s3_image_call(request):
    """
    URL: /api/fetch-s3-image/?issue_id=<issue_id>
    - Lists up to one object in `issues/{issue_id}/`
    - Returns a presigned GET URL for that object
    """
    issue_id = request.GET.get("issue_id")
    if not issue_id:
        return JsonResponse({"error": "Missing 'issue_id' parameter."}, status=400)

    bucket = settings.AWS_STORAGE_BUCKET_NAME
    prefix = f"issues/{issue_id}/"
    s3 = get_s3_client()

    # List up to one object under that prefix
    try:
        resp = s3.list_objects_v2(Bucket=bucket, Prefix=prefix, MaxKeys=1)
    except ClientError as e:
        return JsonResponse({"error": f"S3 list_objects error: {e}"}, status=500)

    contents = resp.get("Contents")
    if not contents:
        raise Http404("No image found for that issue_id")

    key = contents[0]["Key"]

    # Generate a presigned URL valid for 1 hour
    try:
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=3600,
        )
    except ClientError as e:
        return JsonResponse({"error": f"Failed to get presigned URL: {e}"}, status=500)

    return JsonResponse({"url": url})


@require_GET
async def get_general_run_data_call(request):
    """
    Handle the GET request to retrieve the most recent GENERAL data from Firestore.

    This view function retrieves all general data (i.e. title, driver, date, description) from 
    Firestore and returns it as a JSON response.

    Request Method:
        GET: Retrieves all data from Firestore.

    Returns:
        JsonResponse: A JSON response containing all data from Firestore.

    Example:
        GET /api/general-run-data -> Retrieves all GENERAL data from Firestore.
    """

    try:
        data = await sync_to_async(get_general_run_data)(filter_limit=10)
        
        return JsonResponse({"recentRuns": data}, status=200)
    except Exception as e:
        return JsonResponse({"error": f"An unexpected error occurred: {str(e)}"}, status=500)


@require_GET
async def get_specific_run_data_call(request):
    try:
        run_title = request.GET.get('runTitle')
        categories = request.GET.get('categories')

        categories_list = []
        if len(categories) > 0:
            categories_list = categories.strip().split(",")

        data = await sync_to_async(get_specific_run_data)(run_title, categories_list)
        key_points = {
            "Highest Coolant Temperature": "-100"
        }

        return JsonResponse({"runDataPoints": data, "keyPoints": key_points}, status=200)
    except Exception as e:
        return JsonResponse({"error": f"An unexpected error occurred: {str(e)}"}, status=500)


@require_GET
async def get_specific_run_data_paginated_call(request):
    try:
        run_title = request.GET.get('runTitle')
        page_size = request.GET.get('pageSize')
        start_after_doc = request.GET.get('startAfterDoc')
        end_before_doc = request.GET.get('endBeforeDoc')
        categories = request.GET.get('categories')

        categories_list = []
        if len(categories) > 0:
            categories_list = categories.strip().split(",")

        data = await sync_to_async(get_specific_run_data_paginated)(run_title, page_size, start_after_doc, end_before_doc, categories_list)
        key_points = {
            "Highest Coolant Temperature": "-100"
        }

        return JsonResponse({"runDataPoints": data, "keyPoints": key_points}, status=200)
    except Exception as e:
        return JsonResponse({"error": f"An unexpected error occurred: {str(e)}"}, status=500)


@require_POST
@csrf_exempt
async def add_issue_call(request):
    """
    Handles adding a new issue via a POST request.
    """
    try:
        data = json.loads(request.body.decode('utf-8'))
        result = await sync_to_async(add_issue)(data)
        
        if result is None:
            return JsonResponse({"error": "Failed to create issue"}, status=400)
            
        return JsonResponse({
            "message": "Issue created successfully!",
            "issue_id": result["issue_id"]
        }, status=201)
        
    except Exception as e:
        return JsonResponse({"error": f"An unexpected error occurred: {str(e)}"}, status=500)
    

@require_GET
async def get_all_issues_call(request):
    """
    Retrieves all issues with optional filtering.
    """
    try:
        filters = {}
        driver_filter = request.GET.get('driver')
        subsystem_filter = request.GET.get('subsystem')
        
        if driver_filter:
            filters['driver'] = driver_filter
        if subsystem_filter:
            filters['subsystem'] = subsystem_filter
        
        issues = await sync_to_async(get_all_issues)(filters if filters else None)
        
        if issues is None:
            return JsonResponse({"error": "Failed to retrieve issues"}, status=500)
        
        return JsonResponse({
            "issues": issues,
            "message": "Issues retrieved successfully",
            "count": len(issues)
        }, status=200)
        
    except Exception as e:
        return JsonResponse({
            "error": f"An unexpected error occurred: {str(e)}"
        }, status=500)
    

@require_GET
async def get_issues_paginated_call(request):
    """
    Retrieves a specific page of issues
    """
    try:
        page_size = request.GET.get('pageSize')
        start_at_doc = request.GET.get('startAtDoc')
        start_after_doc = request.GET.get('startAfterDoc')

        data = await sync_to_async(get_issues_paginated)(page_size, start_at_doc, start_after_doc)

        return JsonResponse({"issuesPaginated": data}, status=200)
    except Exception as e:
        return JsonResponse({"error": f"An unexpected error occurred: {str(e)}"}, status=500)



@csrf_exempt
async def update_issue_call(request, issue_id):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body.decode('utf-8'))
            result = await sync_to_async(update_issue)(issue_id, data)
            
            if result is None:
                return JsonResponse({"error": "Failed to update issue or issue not found"}, status=400)
                
            return JsonResponse({
                "message": "Issue updated successfully!",
                "issue_id": result["issue_id"]
            }, status=200)
            
        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}"}, status=500)
        
    return JsonResponse({"error": "Invalid request method. Use PUT."}, status=400)

@csrf_exempt
async def delete_issue_call(request, issue_id):
    """
    Handles deleting an issue via a DELETE request.

    This endpoint deletes an existing issue from the database based on the provided issue_id.
    It expects a DELETE request and returns a success message upon completion.

    Args:
        issue_id (str): The ID of the issue to delete.

    Methods:
    - DELETE: Deletes the issue with the specified ID.

    Returns:
    - JSON response with a success message if deletion is successful (status 200).
    - JSON response with an error message if the request method is not DELETE (status 400)
      or if an error occurs during deletion (status 500).
    """
    if request.method == 'DELETE':
        try:
            result = await sync_to_async(delete_issue)(issue_id)
            
            if result is None:
                return JsonResponse({"error": "Failed to delete issue or issue not found"}, status=404)

            await sync_to_async(delete_s3_folder)(f"issues/{issue_id}/")
        
            return JsonResponse({
                "message": "Issue deleted successfully!",
                "issue_id": issue_id
            }, status=200)
            
        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}"}, status=500)
        
    return JsonResponse({"error": "Invalid request method. Use DELETE."}, status=400)